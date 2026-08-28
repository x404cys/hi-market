import { OrderActionsMenu } from "@/components/orders/order-actions-menu";
import { OrderFilters } from "@/components/orders/order-filters";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderStatusControl } from "@/components/orders/order-status-control";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatOrderAddress,
  formatOrderDate,
  formatOrderTime,
  formatRelativeTime,
  orderStatusLabels,
  orderStatusOptions,
} from "@/lib/orders/order-format";
import type { OrderListItemDto } from "@/lib/orders/order-types";
import { formatIqd } from "@/lib/products/product-format";
import { listActiveDeliveryZones } from "@/lib/services/delivery-zone.service";
import { listOrders } from "@/lib/services/order.service";
import { orderQuerySchema } from "@/lib/validations/order";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseOrderQuery(params);
  const [ordersResult, zones] = await Promise.all([
    listOrders(query),
    listActiveDeliveryZones(),
  ]);
  const hasFilters = Boolean(
    query.search || query.status || query.date || query.deliveryZoneId,
  );

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">الطلبات</h1>
            <p className="mt-1 text-sm text-slate-500">
              إدارة ومتابعة طلبات المتجر.
            </p>
          </div>
          <Button asChild variant="outline" className="h-9 gap-2 self-start rounded-md">
            <Link href="/dashboard">
              لوحة التحكم
              <ClipboardList className="size-4" />
            </Link>
          </Button>
        </header>

        <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <StatusSummaryCard
            href="/dashboard/orders"
            label="الكل"
            value={ordersResult.summary.totalOrders}
            active={!query.status}
          />
          {orderStatusOptions.map((status) => (
            <StatusSummaryCard
              key={status}
              href={`/dashboard/orders?status=${status}`}
              label={orderStatusLabels[status]}
              value={ordersResult.summary.statusCounts[status]}
              active={query.status === status}
            />
          ))}
        </section>

        <OrderFilters zones={zones} />

        <Card className="rounded-lg border-slate-200 bg-white shadow-none">
          <CardContent className="p-0">
            {ordersResult.data.length === 0 ? (
              <EmptyOrdersState hasFilters={hasFilters} />
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <TableHeader>الطلب</TableHeader>
                        <TableHeader>العميل</TableHeader>
                        <TableHeader>العنوان</TableHeader>
                        <TableHeader>المنتجات</TableHeader>
                        <TableHeader>الإجمالي</TableHeader>
                        <TableHeader>الحالة</TableHeader>
                        <TableHeader>التاريخ</TableHeader>
                        <TableHeader>الإجراءات</TableHeader>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ordersResult.data.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3">
                            <Link
                              href={`/dashboard/orders/${order.id}`}
                              className="font-semibold text-slate-950 hover:underline"
                            >
                              #{order.orderNumber}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">
                              {order.customerName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {order.customerPhone}
                            </p>
                          </td>
                          <td className="max-w-72 px-4 py-3 text-slate-600">
                            <p className="truncate">{formatOrderAddress(order)}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {order.itemCount.toLocaleString("ar-IQ")} منتجات
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {formatIqd(order.total)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-2">
                              <OrderStatusBadge status={order.status} />
                              <OrderStatusControl
                                orderId={order.id}
                                status={order.status}
                                compact
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            <p>{formatOrderDate(order.createdAt)}</p>
                            <p>{formatOrderTime(order.createdAt)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <OrderActionsMenu
                              orderId={order.id}
                              customerPhone={order.customerPhone}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-slate-100 lg:hidden">
                  {ordersResult.data.map((order) => (
                    <MobileOrderCard key={order.id} order={order} />
                  ))}
                </div>
              </>
            )}

            <OrdersPagination
              page={ordersResult.pagination.page}
              limit={ordersResult.pagination.limit}
              total={ordersResult.pagination.total}
              totalPages={ordersResult.pagination.totalPages}
              params={params}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function parseOrderQuery(params: Record<string, string | string[] | undefined>) {
  const firstValue = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const parsed = orderQuerySchema.safeParse({
    page: firstValue("page"),
    limit: firstValue("limit"),
    search: firstValue("search"),
    status: firstValue("status"),
    date: firstValue("date"),
    deliveryZoneId: firstValue("deliveryZoneId"),
    sortBy: firstValue("sortBy"),
    order: firstValue("order"),
  });

  return parsed.success
    ? parsed.data
    : orderQuerySchema.parse({
        page: "1",
        limit: "20",
        sortBy: "createdAt",
        order: "desc",
      });
}

function StatusSummaryCard({
  href,
  label,
  value,
  active,
}: {
  href: string;
  label: string;
  value: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg border px-3 py-2 transition ${
        active
          ? "border-slate-950 bg-slate-950 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      }`}
    >
      <p className="text-xs opacity-75">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value.toLocaleString("ar-IQ")}</p>
    </Link>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-right font-medium">{children}</th>;
}

function MobileOrderCard({ order }: { order: OrderListItemDto }) {
  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/dashboard/orders/${order.id}`} className="min-w-0">
          <p className="font-semibold">#{order.orderNumber}</p>
          <p className="mt-1 truncate text-sm text-slate-700">{order.customerName}</p>
          <p className="text-xs text-slate-500">{order.customerPhone}</p>
        </Link>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-3 line-clamp-1 text-xs text-slate-500">
        {formatOrderAddress(order)}
      </p>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-semibold">{formatIqd(order.total)}</span>
        <span className="text-xs text-slate-500">
          {formatRelativeTime(order.createdAt)}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <OrderStatusControl orderId={order.id} status={order.status} compact />
        <OrderActionsMenu orderId={order.id} customerPhone={order.customerPhone} />
      </div>
    </article>
  );
}

function OrdersPagination({
  page,
  limit,
  total,
  totalPages,
  params,
}: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  params: Record<string, string | string[] | undefined>;
}) {
  if (total === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <p>
        عرض {start.toLocaleString("ar-IQ")}–{end.toLocaleString("ar-IQ")} من{" "}
        {total.toLocaleString("ar-IQ")} طلب
      </p>
      <div className="flex items-center gap-2">
        {page <= 1 ? (
          <Button variant="outline" size="sm" disabled>
            <ChevronRight className="size-4" />
            السابق
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href={pageHref(params, page - 1)}>
              <ChevronRight className="size-4" />
              السابق
            </Link>
          </Button>
        )}
        <span className="text-xs">
          صفحة {page.toLocaleString("ar-IQ")} من{" "}
          {Math.max(totalPages, 1).toLocaleString("ar-IQ")}
        </span>
        {page >= totalPages ? (
          <Button variant="outline" size="sm" disabled>
            التالي
            <ChevronLeft className="size-4" />
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href={pageHref(params, page + 1)}>
              التالي
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function EmptyOrdersState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-4 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-md bg-slate-100 text-slate-500">
        <ClipboardList className="size-5" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-950">
        {hasFilters ? "لا توجد نتائج مطابقة" : "لا توجد طلبات بعد"}
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {hasFilters
          ? "جرّب تغيير البحث أو الفلاتر."
          : "ستظهر الطلبات الجديدة هنا فور وصولها."}
      </p>
      {hasFilters && (
        <Button asChild className="mt-5 rounded-md">
          <Link href="/dashboard/orders">مسح الفلاتر</Link>
        </Button>
      )}
    </div>
  );
}

function pageHref(
  params: Record<string, string | string[] | undefined>,
  page: number,
) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    const entry = Array.isArray(value) ? value[0] : value;
    if (entry) nextParams.set(key, entry);
  });

  nextParams.set("page", String(page));
  return `/dashboard/orders?${nextParams.toString()}`;
}
