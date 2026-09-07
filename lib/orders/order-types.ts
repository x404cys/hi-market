import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductUnit,
} from "@/lib/prisma-client";

export type OrderItemDto = {
  id: string;
  productId: string | null;
  productName: string;
  sku: string | null;
  barcode: string | null;
  image: string | null;
  unit: ProductUnit;
  unitValue: string | null;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
  taxAmount: string;
  total: string;
};

export type OrderDto = {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  secondaryPhone: string | null;
  governorate: string | null;
  city: string | null;
  area: string | null;
  street: string | null;
  address: string;
  landmark: string | null;
  customerNotes: string | null;
  deliveryZoneId: string | null;
  deliveryZoneName: string | null;
  subtotal: string;
  discountTotal: string;
  deliveryFee: string;
  taxTotal: string;
  total: string;
  couponCode: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  placedAt: string;
  createdAt: string;
  items: OrderItemDto[];
};

export type OrderStatusHistoryDto = {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  createdAt: string;
};

export type OrderDetailDto = OrderDto & {
  statusHistory: OrderStatusHistoryDto[];
};

export type OrderListItemDto = {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  governorate: string | null;
  city: string | null;
  area: string | null;
  address: string;
  deliveryZoneName: string | null;
  total: string;
  status: OrderStatus;
  placedAt: string;
  createdAt: string;
  itemCount: number;
};

export type OrderListSummary = {
  totalOrders: number;
  statusCounts: Record<OrderStatus, number>;
};

export type OrderListResult = {
  data: OrderListItemDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: OrderListSummary;
};
