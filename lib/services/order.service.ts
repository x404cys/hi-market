import {
  CouponType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  ProductStatus,
  StockMovementType,
} from "@/app/generated/prisma";
import { ApiError } from "@/lib/api-response";
import type { DebugTracker } from "@/lib/debug/server-debug";
import { decimalToString, toPrismaDecimal } from "@/lib/decimal";
import {
  operationalOrderStatuses,
  orderStatusLabels,
} from "@/lib/orders/order-format";
import type {
  OrderDetailDto,
  OrderDto,
  OrderListItemDto,
  OrderListResult,
  OrderStatusHistoryDto,
} from "@/lib/orders/order-types";
import prisma from "@/lib/prisma";
import type { CreateGuestOrderInput } from "@/lib/validations/checkout";
import type {
  OrderQueryInput,
  UpdateOrderStatusInput,
} from "@/lib/validations/order";

const orderSelect = {
  id: true,
  orderNumber: true,
  customerName: true,
  customerPhone: true,
  secondaryPhone: true,
  governorate: true,
  city: true,
  area: true,
  street: true,
  address: true,
  landmark: true,
  customerNotes: true,
  deliveryZoneId: true,
  deliveryZoneName: true,
  subtotal: true,
  discountTotal: true,
  deliveryFee: true,
  taxTotal: true,
  total: true,
  couponCode: true,
  status: true,
  paymentMethod: true,
  paymentStatus: true,
  placedAt: true,
  createdAt: true,
  items: {
    select: {
      id: true,
      productId: true,
      productName: true,
      sku: true,
      barcode: true,
      image: true,
      unit: true,
      unitValue: true,
      quantity: true,
      unitPrice: true,
      discountAmount: true,
      taxAmount: true,
      total: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  },
} satisfies Prisma.OrderSelect;

const checkoutProductSelect = {
  id: true,
  name: true,
  sku: true,
  barcode: true,
  image: true,
  price: true,
  unit: true,
  unitValue: true,
  minOrderQty: true,
  orderStep: true,
  stock: true,
  trackInventory: true,
  allowBackorder: true,
  status: true,
} satisfies Prisma.ProductSelect;

const orderListSelect = {
  id: true,
  orderNumber: true,
  customerName: true,
  customerPhone: true,
  governorate: true,
  city: true,
  area: true,
  address: true,
  deliveryZoneName: true,
  total: true,
  status: true,
  placedAt: true,
  createdAt: true,
  _count: {
    select: {
      items: true,
    },
  },
} satisfies Prisma.OrderSelect;

const orderDetailSelect = {
  ...orderSelect,
  statusHistory: {
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      note: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  },
} satisfies Prisma.OrderSelect;

type OrderRecord = Prisma.OrderGetPayload<{ select: typeof orderSelect }>;
type OrderListRecord = Prisma.OrderGetPayload<{ select: typeof orderListSelect }>;
type OrderDetailRecord = Prisma.OrderGetPayload<{
  select: typeof orderDetailSelect;
}>;
type CheckoutProduct = Prisma.ProductGetPayload<{
  select: typeof checkoutProductSelect;
}>;

type OrderDebugContext = {
  debugId?: string;
  tracker?: DebugTracker;
};

export async function createGuestOrder(
  input: CreateGuestOrderInput,
  debug?: OrderDebugContext,
) {
  const tracker = debug?.tracker;

  tracker?.stage("[ORDER 5] Order service started", {
    debugId: debug?.debugId,
    itemCount: input.items.length,
    productIds: input.items.map((item) => item.productId),
  });

  assertUniqueProductIds(input.items.map((item) => item.productId));

  const requestedProducts = new Map(
    input.items.map((item) => [item.productId, toPrismaDecimal(item.quantity)]),
  );
  tracker?.stage("[ORDER SERVICE] Product IDs", {
    productIds: Array.from(requestedProducts.keys()),
  });

  const products = await prisma.product.findMany({
    where: { id: { in: Array.from(requestedProducts.keys()) } },
    select: checkoutProductSelect,
  });
  tracker?.stage("[ORDER 6] Products fetched", {
    requested: requestedProducts.size,
    found: products.length,
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      status: product.status,
      stock: product.stock.toString(),
      trackInventory: product.trackInventory,
      allowBackorder: product.allowBackorder,
    })),
  });

  if (products.length !== requestedProducts.size) {
    const foundProductIds = new Set(products.map((product) => product.id));
    throw new ApiError(
      "بعض المنتجات لم تعد متوفرة.",
      400,
      {
        items: ["One or more cart products were not found"],
        missingProductIds: Array.from(requestedProducts.keys()).filter(
          (productId) => !foundProductIds.has(productId),
        ),
      },
      "PRODUCT_NOT_FOUND",
    );
  }

  const productsById = new Map(products.map((product) => [product.id, product]));
  const itemRows = input.items.map((item) => {
    const product = productsById.get(item.productId);
    if (!product) {
      throw new ApiError(
        "بعض المنتجات لم تعد متوفرة.",
        400,
        { items: [`Product ${item.productId} was not found`] },
        "PRODUCT_NOT_FOUND",
      );
    }

    const quantity = toPrismaDecimal(item.quantity);
    validateCheckoutProduct(product, quantity);
    const lineTotal = toMoney(product.price.mul(quantity));

    return {
      product,
      quantity,
      lineTotal,
      row: {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        barcode: product.barcode,
        image: product.image,
        unit: product.unit,
        unitValue: product.unitValue,
        quantity,
        unitPrice: product.price,
        discountAmount: zeroMoney(),
        taxAmount: zeroMoney(),
        total: lineTotal,
      },
    };
  });
  tracker?.stage("[ORDER 7] Stock validated", {
    items: itemRows.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      requested: item.quantity.toString(),
      available: item.product.stock.toString(),
      trackInventory: item.product.trackInventory,
      allowBackorder: item.product.allowBackorder,
    })),
  });

  const subtotal = itemRows.reduce(
    (sum, item) => sum.plus(item.lineTotal),
    zeroMoney(),
  );
  tracker?.stage("[ORDER 8] Prices calculated", {
    lines: itemRows.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity.toString(),
      unitPrice: item.product.price.toString(),
      total: item.lineTotal.toString(),
    })),
    subtotal: subtotal.toString(),
  });

  const deliveryZone = input.deliveryZoneId
    ? await prisma.deliveryZone.findFirst({
        where: {
          id: input.deliveryZoneId,
          isActive: true,
        },
      })
    : null;

  if (input.deliveryZoneId && !deliveryZone) {
    throw new ApiError(
      "منطقة التوصيل غير متاحة.",
      400,
      { deliveryZoneId: ["Delivery zone was not found or is inactive"] },
      "DELIVERY_ERROR",
    );
  }

  if (
    deliveryZone?.minimumOrder &&
    subtotal.lessThan(deliveryZone.minimumOrder)
  ) {
    throw new ApiError(
      "قيمة الطلب أقل من الحد الأدنى لهذه المنطقة.",
      400,
      {
        deliveryZoneId: ["Minimum order was not met"],
        minimumOrder: deliveryZone.minimumOrder.toString(),
        subtotal: subtotal.toString(),
      },
      "DELIVERY_ERROR",
    );
  }

  let deliveryFee =
    deliveryZone?.freeDeliveryFrom &&
    subtotal.greaterThanOrEqualTo(deliveryZone.freeDeliveryFrom)
      ? zeroMoney()
      : toMoney(deliveryZone?.fee ?? zeroMoney());
  tracker?.stage("[ORDER 9] Delivery calculated", {
    deliveryZoneId: deliveryZone?.id ?? null,
    deliveryZoneName: deliveryZone?.name ?? null,
    deliveryFee: deliveryFee.toString(),
    minimumOrder: deliveryZone?.minimumOrder?.toString() ?? null,
    freeDeliveryFrom: deliveryZone?.freeDeliveryFrom?.toString() ?? null,
  });

  const coupon = input.couponCode
    ? await prisma.coupon.findUnique({ where: { code: input.couponCode } })
    : null;

  if (input.couponCode && !coupon) {
    throw new ApiError(
      "رمز الخصم غير صالح.",
      400,
      {
        couponCode: ["Invalid coupon"],
      },
      "INVALID_COUPON",
    );
  }

  let discountTotal = zeroMoney();
  if (coupon) {
    validateCoupon(coupon, subtotal);

    if (coupon.type === CouponType.FREE_DELIVERY) {
      deliveryFee = zeroMoney();
    } else {
      discountTotal = calculateCouponDiscount(coupon, subtotal);
    }
  }

  const taxTotal = zeroMoney();
  const total = toMoney(subtotal.minus(discountTotal).plus(deliveryFee).plus(taxTotal));
  tracker?.stage("[ORDER SERVICE] Calculated totals", {
    subtotal: subtotal.toString(),
    discountTotal: discountTotal.toString(),
    deliveryFee: deliveryFee.toString(),
    taxTotal: taxTotal.toString(),
    total: total.toString(),
  });

  const transactionWaitStartedAt = Date.now();
  tracker?.stage("[ORDER 10] Waiting for Prisma transaction", {
    itemCount: itemRows.length,
    inventoryTrackedItems: itemRows.filter((item) => item.product.trackInventory)
      .length,
    hasCoupon: Boolean(coupon),
  });

  const transactionResult = await prisma.$transaction(
    async (tx) => {
      const transactionStartedAt = Date.now();
      tracker?.stage("[ORDER 10.1] Prisma transaction started", {
        waitMs: transactionStartedAt - transactionWaitStartedAt,
      });

      const order = await tx.order.create({
        data: {
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          secondaryPhone: input.secondaryPhone ?? null,
          governorate: input.governorate ?? deliveryZone?.governorate ?? null,
          city: input.city ?? deliveryZone?.city ?? null,
          area: input.area ?? null,
          street: input.street ?? null,
          address: input.address,
          landmark: input.landmark ?? null,
          latitude: input.latitude ? toPrismaDecimal(input.latitude) : null,
          longitude: input.longitude ? toPrismaDecimal(input.longitude) : null,
          customerNotes: input.customerNotes ?? null,
          deliveryZoneId: deliveryZone?.id ?? null,
          deliveryZoneName: deliveryZone?.name ?? null,
          subtotal,
          discountTotal,
          deliveryFee,
          taxTotal,
          total,
          couponId: coupon?.id ?? null,
          couponCode: coupon?.code ?? input.couponCode ?? null,
          status: OrderStatus.PENDING,
          paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
          paymentStatus: PaymentStatus.PENDING,
          items: {
            create: itemRows.map((item) => item.row),
          },
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: OrderStatus.PENDING,
              note: "Guest checkout order created",
            },
          },
        },
        select: {
          id: true,
        },
      });
      tracker?.stage("[ORDER 11] Order created", {
        orderId: order.id,
      });

      for (const item of itemRows) {
        if (!item.product.trackInventory) continue;

        const updatedProducts = await tx.product.updateManyAndReturn({
          where: {
            id: item.product.id,
            ...(item.product.allowBackorder ? {} : { stock: { gte: item.quantity } }),
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
          select: {
            stock: true,
          },
        });

        const updatedProduct = updatedProducts[0];

        if (!updatedProduct) {
          const currentProduct = await tx.product.findUnique({
            where: { id: item.product.id },
            select: { stock: true },
          });

          if (!currentProduct) {
            throw new ApiError(
              "بعض المنتجات لم تعد متوفرة.",
              400,
              { items: [`Product ${item.product.id} was not found`] },
              "PRODUCT_NOT_FOUND",
            );
          }

          throw new ApiError(
            `${item.product.name} غير متوفر بالكمية المطلوبة.`,
            409,
            {
              items: [`Insufficient stock for ${item.product.id}`],
              productId: item.product.id,
              productName: item.product.name,
              requested: item.quantity.toString(),
              available: currentProduct.stock.toString(),
            },
            "INSUFFICIENT_STOCK",
          );
        }

        const stockAfter = updatedProduct.stock;
        const stockBefore = stockAfter.plus(item.quantity);

        await tx.stockMovement.create({
          data: {
            productId: item.product.id,
            orderId: order.id,
            type: StockMovementType.SALE,
            quantity: item.quantity.mul(-1),
            stockBefore,
            stockAfter,
            note: "Guest checkout sale",
          },
        });
      }
      tracker?.stage("[ORDER 12] Stock movements created", {
        movementCount: itemRows.filter((item) => item.product.trackInventory).length,
      });

      if (coupon) {
        const couponUpdate = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            isActive: true,
            ...(coupon.usageLimit === null
              ? {}
              : { usedCount: { lt: coupon.usageLimit } }),
          },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });

        if (couponUpdate.count !== 1) {
          throw new ApiError(
            "رمز الخصم لم يعد متاحاً.",
            400,
            {
              couponCode: ["Coupon is no longer available or usage limit reached"],
            },
            "INVALID_COUPON",
          );
        }
      }

      const created = await tx.order.findUniqueOrThrow({
        where: { id: order.id },
        select: orderSelect,
      });

      return {
        order: serializeOrder(created),
        orderId: created.id,
        total: created.total.toString(),
        transactionDurationMs: Date.now() - transactionStartedAt,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 10_000,
      timeout: 15_000,
    },
  );

  tracker?.stage("[ORDER 13] Transaction completed", {
    orderId: transactionResult.orderId,
    total: transactionResult.total,
    durationMs: Date.now() - transactionWaitStartedAt,
    transactionDurationMs: transactionResult.transactionDurationMs,
  });

  return transactionResult.order;
}

export async function listOrders(query: OrderQueryInput): Promise<OrderListResult> {
  const where = buildOrderWhere(query);
  const summaryWhere = buildOrderWhere({ ...query, status: undefined });
  const orderBy = {
    [query.sortBy]: query.order,
  } as Prisma.OrderOrderByWithRelationInput;

  const [orders, total, totalOrders, statusGroups] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: orderListSelect,
    }),
    prisma.order.count({ where }),
    prisma.order.count({ where: summaryWhere }),
    prisma.order.groupBy({
      by: ["status"],
      where: summaryWhere,
      orderBy: {
        status: "asc",
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  return {
    data: orders.map(serializeOrderListItem),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
    summary: {
      totalOrders,
      statusCounts: Object.fromEntries(
        Object.values(OrderStatus).map((status) => {
          const group = statusGroups.find((item) => item.status === status);

          return [status, group ? getGroupCount(group._count) : 0];
        }),
      ) as Record<OrderStatus, number>,
    },
  };
}

export async function listRecentOrders(limit = 6) {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: orderListSelect,
  });

  return orders.map(serializeOrderListItem);
}

export async function getOrder(orderId: string): Promise<OrderDetailDto> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: orderDetailSelect,
  });

  if (!order) {
    throw new ApiError("Order not found", 404, undefined, "ORDER_NOT_FOUND");
  }

  return serializeOrderDetail(order);
}

export async function updateOrderStatus(
  orderId: string,
  input: UpdateOrderStatusInput,
) {
  const updated = await prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          orderNumber: true,
        },
      });

      if (!order) {
        throw new ApiError("Order not found", 404, undefined, "ORDER_NOT_FOUND");
      }

      if (order.status === input.status) {
        return tx.order.findUniqueOrThrow({
          where: { id: orderId },
          select: orderDetailSelect,
        });
      }

      assertStatusTransition(order.status, input.status);

      if (input.status === OrderStatus.CANCELLED) {
        await cancelOrderInsideTransaction(tx, order, input.note);
      } else {
        const statusUpdate = await tx.order.updateMany({
          where: {
            id: order.id,
            status: order.status,
          },
          data: buildStatusUpdateData(input.status),
        });

        if (statusUpdate.count !== 1) {
          throw new ApiError(
            "تم تحديث الطلب من جهاز آخر. أعد تحميل الصفحة وحاول مرة أخرى.",
            409,
            { status: ["Concurrent status update detected"] },
            "CONCURRENT_STATUS_UPDATE",
          );
        }

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: input.status,
            note: input.note ?? statusHistoryNote(input.status),
          },
        });
      }

      return tx.order.findUniqueOrThrow({
        where: { id: orderId },
        select: orderDetailSelect,
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 10_000,
      timeout: 15_000,
    },
  );

  return serializeOrderDetail(updated);
}

function assertUniqueProductIds(productIds: string[]) {
  if (new Set(productIds).size !== productIds.length) {
    throw new ApiError("لا يمكن تكرار نفس المنتج في طلب checkout.", 400, {
      items: ["Duplicate product ids are not accepted"],
    }, "BUSINESS_RULE_ERROR");
  }
}

function buildOrderWhere(query: OrderQueryInput) {
  const andFilters: Prisma.OrderWhereInput[] = [];

  if (query.status === "active") {
    andFilters.push({ status: { in: [...operationalOrderStatuses] } });
  } else if (query.status) {
    andFilters.push({ status: query.status });
  }

  if (query.deliveryZoneId) {
    andFilters.push({ deliveryZoneId: query.deliveryZoneId });
  }

  const dateRange = getOrderDateRange(query.date);
  if (dateRange) {
    andFilters.push({
      createdAt: {
        gte: dateRange.start,
        lt: dateRange.end,
      },
    });
  }

  const search = query.search?.trim();
  if (search) {
    const maybeOrderNumber = Number(search.replace(/^#/, ""));
    andFilters.push({
      OR: [
        Number.isInteger(maybeOrderNumber) && maybeOrderNumber > 0
          ? { orderNumber: maybeOrderNumber }
          : undefined,
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search } },
        { secondaryPhone: { contains: search } },
        { address: { contains: search, mode: "insensitive" } },
        { deliveryZoneName: { contains: search, mode: "insensitive" } },
      ].filter(Boolean) as Prisma.OrderWhereInput[],
    });
  }

  return andFilters.length > 0 ? { AND: andFilters } : {};
}

function getOrderDateRange(value: string | undefined) {
  if (!value || value === "all") return null;

  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);

  if (value === "today") {
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return { start, end };
  }

  if (value === "yesterday") {
    const end = new Date(start);
    start.setDate(start.getDate() - 1);
    return { start, end };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const dateStart = new Date(`${value}T00:00:00`);
    if (Number.isNaN(dateStart.getTime())) return null;
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateStart.getDate() + 1);
    return { start: dateStart, end: dateEnd };
  }

  return null;
}

function assertStatusTransition(fromStatus: OrderStatus, toStatus: OrderStatus) {
  const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
    READY: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
    OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
    DELIVERED: [],
    CANCELLED: [],
  };

  if (allowedTransitions[fromStatus].includes(toStatus)) return;

  throw new ApiError(
    `لا يمكن تغيير الحالة من ${orderStatusLabels[fromStatus]} إلى ${orderStatusLabels[toStatus]}.`,
    400,
    {
      status: [`Invalid transition from ${fromStatus} to ${toStatus}`],
      fromStatus,
      toStatus,
    },
    "INVALID_STATUS_TRANSITION",
  );
}

function buildStatusUpdateData(status: OrderStatus): Prisma.OrderUpdateManyMutationInput {
  return {
    status,
    ...(status === OrderStatus.CONFIRMED ? { confirmedAt: new Date() } : {}),
    ...(status === OrderStatus.DELIVERED ? { deliveredAt: new Date() } : {}),
    ...(status === OrderStatus.CANCELLED ? { cancelledAt: new Date() } : {}),
  };
}

async function cancelOrderInsideTransaction(
  tx: Prisma.TransactionClient,
  order: {
    id: string;
    status: OrderStatus;
    orderNumber: number;
  },
  note: string | undefined,
) {
  const statusUpdate = await tx.order.updateMany({
    where: {
      id: order.id,
      status: order.status,
    },
    data: buildStatusUpdateData(OrderStatus.CANCELLED),
  });

  if (statusUpdate.count !== 1) {
    throw new ApiError(
      "تم تحديث الطلب من جهاز آخر. أعد تحميل الصفحة وحاول مرة أخرى.",
      409,
      { status: ["Concurrent cancellation detected"] },
      "CONCURRENT_STATUS_UPDATE",
    );
  }

  const saleMovements = await tx.stockMovement.findMany({
    where: {
      orderId: order.id,
      type: StockMovementType.SALE,
    },
    select: {
      productId: true,
      quantity: true,
    },
  });

  for (const movement of saleMovements) {
    const restoreQuantity = movement.quantity.mul(-1);
    if (restoreQuantity.lessThanOrEqualTo(0)) continue;

    const updatedProducts = await tx.product.updateManyAndReturn({
      where: {
        id: movement.productId,
      },
      data: {
        stock: {
          increment: restoreQuantity,
        },
      },
      select: {
        stock: true,
      },
    });

    const updatedProduct = updatedProducts[0];
    if (!updatedProduct) {
      throw new ApiError(
        "تعذر إرجاع المخزون لأحد منتجات الطلب.",
        409,
        { items: [`Product ${movement.productId} was not found`] },
        "STOCK_RESTORE_FAILED",
      );
    }

    const stockAfter = updatedProduct.stock;
    const stockBefore = stockAfter.minus(restoreQuantity);

    await tx.stockMovement.create({
      data: {
        productId: movement.productId,
        orderId: order.id,
        type: StockMovementType.CANCELLATION,
        quantity: restoreQuantity,
        stockBefore,
        stockAfter,
        note: `Order #${order.orderNumber} cancelled`,
      },
    });
  }

  await tx.orderStatusHistory.create({
    data: {
      orderId: order.id,
      fromStatus: order.status,
      toStatus: OrderStatus.CANCELLED,
      note: note ?? "Order cancelled and stock restored where applicable",
    },
  });
}

function statusHistoryNote(status: OrderStatus) {
  return `تم تحديث حالة الطلب إلى ${orderStatusLabels[status]}`;
}

function getGroupCount(count: true | { _all?: number } | undefined) {
  return count === true ? 0 : count?._all ?? 0;
}

function serializeOrderListItem(order: OrderListRecord): OrderListItemDto {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    governorate: order.governorate,
    city: order.city,
    area: order.area,
    address: order.address,
    deliveryZoneName: order.deliveryZoneName,
    total: decimalToString(order.total) ?? "0",
    status: order.status,
    placedAt: order.placedAt.toISOString(),
    createdAt: order.createdAt.toISOString(),
    itemCount: order._count.items,
  };
}

function serializeOrderDetail(order: OrderDetailRecord): OrderDetailDto {
  return {
    ...serializeOrder(order),
    statusHistory: order.statusHistory.map(serializeOrderStatusHistory),
  };
}

function serializeOrderStatusHistory(
  history: OrderDetailRecord["statusHistory"][number],
): OrderStatusHistoryDto {
  return {
    ...history,
    createdAt: history.createdAt.toISOString(),
  };
}

function validateCheckoutProduct(product: CheckoutProduct, quantity: Prisma.Decimal) {
  if (product.status !== ProductStatus.ACTIVE) {
    throw new ApiError(
      `${product.name} غير متاح للطلب حالياً.`,
      400,
      {
        items: [`Product ${product.id} status is ${product.status}`],
        productId: product.id,
        productName: product.name,
        status: product.status,
      },
      "PRODUCT_UNAVAILABLE",
    );
  }

  if (quantity.lessThan(product.minOrderQty)) {
    throw new ApiError(
      `${product.name} أقل من الحد الأدنى للطلب.`,
      400,
      {
        items: [`Quantity is below minimum for ${product.id}`],
        productId: product.id,
        productName: product.name,
        requested: quantity.toString(),
        minOrderQty: product.minOrderQty.toString(),
      },
      "INVALID_QUANTITY",
    );
  }

  if (!quantity.minus(product.minOrderQty).mod(product.orderStep).isZero()) {
    throw new ApiError(
      `${product.name} لا يطابق خطوة الكمية المسموحة.`,
      400,
      {
        items: [`Quantity does not match order step for ${product.id}`],
        productId: product.id,
        productName: product.name,
        requested: quantity.toString(),
        minOrderQty: product.minOrderQty.toString(),
        orderStep: product.orderStep.toString(),
      },
      "INVALID_QUANTITY",
    );
  }

  if (
    product.trackInventory &&
    !product.allowBackorder &&
    product.stock.lessThan(quantity)
  ) {
    throw new ApiError(
      `${product.name} غير متوفر بالكمية المطلوبة.`,
      409,
      {
        items: [`Insufficient stock for ${product.id}`],
        productId: product.id,
        productName: product.name,
        requested: quantity.toString(),
        available: product.stock.toString(),
      },
      "INSUFFICIENT_STOCK",
    );
  }
}

function validateCoupon(
  coupon: Prisma.CouponGetPayload<Record<string, never>>,
  subtotal: Prisma.Decimal,
) {
  const now = new Date();

  if (!coupon.isActive) {
    throw new ApiError("رمز الخصم غير فعال.", 400, {
      couponCode: ["Inactive coupon"],
    }, "INVALID_COUPON");
  }

  if (coupon.startsAt && coupon.startsAt > now) {
    throw new ApiError("رمز الخصم غير فعال بعد.", 400, {
      couponCode: ["Coupon has not started"],
    }, "INVALID_COUPON");
  }

  if (coupon.endsAt && coupon.endsAt < now) {
    throw new ApiError("انتهت صلاحية رمز الخصم.", 400, {
      couponCode: ["Coupon expired"],
    }, "INVALID_COUPON");
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError("تم استخدام رمز الخصم للحد الأقصى.", 400, {
      couponCode: ["Coupon usage limit reached"],
    }, "INVALID_COUPON");
  }

  if (
    coupon.minimumOrderAmount &&
    subtotal.lessThan(coupon.minimumOrderAmount)
  ) {
    throw new ApiError("قيمة الطلب أقل من الحد الأدنى لرمز الخصم.", 400, {
      couponCode: ["Minimum order was not met"],
    }, "INVALID_COUPON");
  }
}

function calculateCouponDiscount(
  coupon: Prisma.CouponGetPayload<Record<string, never>>,
  subtotal: Prisma.Decimal,
) {
  const value = coupon.value ?? zeroMoney();
  let discount =
    coupon.type === CouponType.PERCENTAGE
      ? subtotal.mul(value).div(100)
      : value;

  if (coupon.maximumDiscount && discount.greaterThan(coupon.maximumDiscount)) {
    discount = coupon.maximumDiscount;
  }

  if (discount.greaterThan(subtotal)) {
    discount = subtotal;
  }

  return toMoney(discount);
}

function serializeOrder(order: OrderRecord): OrderDto {
  return {
    ...order,
    subtotal: decimalToString(order.subtotal) ?? "0",
    discountTotal: decimalToString(order.discountTotal) ?? "0",
    deliveryFee: decimalToString(order.deliveryFee) ?? "0",
    taxTotal: decimalToString(order.taxTotal) ?? "0",
    total: decimalToString(order.total) ?? "0",
    placedAt: order.placedAt.toISOString(),
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      ...item,
      unitValue: decimalToString(item.unitValue),
      quantity: decimalToString(item.quantity) ?? "0",
      unitPrice: decimalToString(item.unitPrice) ?? "0",
      discountAmount: decimalToString(item.discountAmount) ?? "0",
      taxAmount: decimalToString(item.taxAmount) ?? "0",
      total: decimalToString(item.total) ?? "0",
    })),
  };
}

function zeroMoney() {
  return new Prisma.Decimal(0);
}

function toMoney(value: Prisma.Decimal | number | string) {
  return new Prisma.Decimal(value).toDecimalPlaces(2);
}
