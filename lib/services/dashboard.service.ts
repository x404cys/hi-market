import { OrderStatus, Prisma } from "@/app/generated/prisma";
import { decimalToString } from "@/lib/decimal";
import {
  operationalOrderStatuses,
  revenueOrderStatuses,
} from "@/lib/orders/order-format";
import type { OrderListItemDto } from "@/lib/orders/order-types";
import prisma from "@/lib/prisma";
import { listRecentOrders } from "@/lib/services/order.service";

export type DashboardStats = {
  todayOrders: number;
  yesterdayOrders: number;
  todayRevenue: string;
  yesterdayRevenue: string;
  activeOrders: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  pendingOrders: number;
  recentOrders: OrderListItemDto[];
  dailySales: Array<{
    date: string;
    label: string;
    total: string;
  }>;
  lowStockPreview: Array<{
    id: string;
    name: string;
    stock: string;
    lowStockAt: string;
  }>;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = getLocalDayRange();
  const yesterday = getPreviousDayRange(today.start);
  const weekStart = getPreviousDaysStart(today.start, 6);

  const [
    todayOrders,
    yesterdayOrders,
    todayRevenue,
    yesterdayRevenue,
    activeOrders,
    lowStockProducts,
    outOfStockProducts,
    pendingOrders,
    lowStockPreview,
    deliveredOrdersForChart,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({
      where: {
        createdAt: {
          gte: today.start,
          lt: today.end,
        },
      },
    }),
    prisma.order.count({
      where: {
        createdAt: {
          gte: yesterday.start,
          lt: yesterday.end,
        },
      },
    }),
    prisma.order.aggregate({
      where: {
        status: { in: [...revenueOrderStatuses] },
        createdAt: {
          gte: today.start,
          lt: today.end,
        },
      },
      _sum: {
        total: true,
      },
    }),
    prisma.order.aggregate({
      where: {
        status: { in: [...revenueOrderStatuses] },
        createdAt: {
          gte: yesterday.start,
          lt: yesterday.end,
        },
      },
      _sum: {
        total: true,
      },
    }),
    prisma.order.count({
      where: {
        status: { in: [...operationalOrderStatuses] },
      },
    }),
    prisma.product.count({
      where: {
        trackInventory: true,
        stock: {
          lte: prisma.product.fields.lowStockAt,
        },
      },
    }),
    prisma.product.count({
      where: {
        trackInventory: true,
        stock: {
          lte: 0,
        },
      },
    }),
    prisma.order.count({
      where: {
        status: OrderStatus.PENDING,
      },
    }),
    prisma.product.findMany({
      where: {
        trackInventory: true,
        stock: {
          lte: prisma.product.fields.lowStockAt,
        },
      },
      orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
      take: 5,
      select: {
        id: true,
        name: true,
        stock: true,
        lowStockAt: true,
      },
    }),
    prisma.order.findMany({
      where: {
        status: { in: [...revenueOrderStatuses] },
        createdAt: {
          gte: weekStart,
          lt: today.end,
        },
      },
      select: {
        createdAt: true,
        total: true,
      },
    }),
    listRecentOrders(6),
  ]);

  return {
    todayOrders,
    yesterdayOrders,
    todayRevenue: decimalToString(todayRevenue._sum.total) ?? "0",
    yesterdayRevenue: decimalToString(yesterdayRevenue._sum.total) ?? "0",
    activeOrders,
    lowStockProducts,
    outOfStockProducts,
    pendingOrders,
    recentOrders,
    dailySales: buildDailySales(deliveredOrdersForChart, weekStart),
    lowStockPreview: lowStockPreview.map((product) => ({
      ...product,
      stock: decimalToString(product.stock) ?? "0",
      lowStockAt: decimalToString(product.lowStockAt) ?? "0",
    })),
  };
}

function getLocalDayRange(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start, end };
}

function getPreviousDayRange(dayStart: Date) {
  const start = new Date(dayStart);
  start.setDate(dayStart.getDate() - 1);
  return {
    start,
    end: new Date(dayStart),
  };
}

function getPreviousDaysStart(dayStart: Date, daysBack: number) {
  const start = new Date(dayStart);
  start.setDate(dayStart.getDate() - daysBack);
  return start;
}

function buildDailySales(
  orders: Array<{ createdAt: Date; total: Prisma.Decimal }>,
  firstDay: Date,
) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() + index);
    date.setHours(0, 0, 0, 0);
    return {
      date,
      key: date.toISOString().slice(0, 10),
      total: new Prisma.Decimal(0),
    };
  });

  const totalsByDay = new Map(days.map((day) => [day.key, day.total]));

  for (const order of orders) {
    const orderDay = new Date(order.createdAt);
    orderDay.setHours(0, 0, 0, 0);
    const key = orderDay.toISOString().slice(0, 10);
    totalsByDay.set(key, (totalsByDay.get(key) ?? new Prisma.Decimal(0)).plus(order.total));
  }

  return days.map((day) => ({
    date: day.key,
    label: new Intl.DateTimeFormat("ar-IQ", {
      weekday: "short",
    }).format(day.date),
    total: decimalToString(totalsByDay.get(day.key)) ?? "0",
  }));
}
