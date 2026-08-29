import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatRelativeTime,
} from "@/lib/orders/order-format";
import { formatIqd, formatQuantity } from "@/lib/products/product-format";
import { getDashboardStats } from "@/lib/services/dashboard.service";
import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  Clock3,
  PackagePlus,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const maxDailySales = Math.max(
    ...stats.dailySales.map((day) => Number(day.total)),
    1,
  );

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
         

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            href="/dashboard/orders?date=today"
            label="طلبات اليوم"
            value={stats.todayOrders.toLocaleString("ar-IQ")}
            hint={comparisonLabel(stats.todayOrders, stats.yesterdayOrders)}
            icon={ShoppingBag}
            tone="sky"
          />
          <DashboardMetricCard
            href="/dashboard/orders?date=today&status=DELIVERED"
            label="مبيعات اليوم"
            value={formatIqd(stats.todayRevenue)}
            hint={comparisonLabel(
              Number(stats.todayRevenue),
              Number(stats.yesterdayRevenue),
            )}
            icon={TrendingUp}
            tone="emerald"
          />
          <DashboardMetricCard
            href="/dashboard/orders?status=active"
            label="طلبات قيد التنفيذ"
            value={stats.activeOrders.toLocaleString("ar-IQ")}
            hint="باستثناء المكتملة والملغاة"
            icon={Clock3}
            tone="amber"
          />
          <DashboardMetricCard
            href="/dashboard/products?stockStatus=low"
            label="المنتجات منخفضة المخزون"
            value={stats.lowStockProducts.toLocaleString("ar-IQ")}
            hint="حسب حد التنبيه لكل منتج"
            icon={AlertTriangle}
            tone="red"
          />
        </section>

        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <section className="space-y-5">
            <Card className="rounded-lg border-slate-200 bg-white shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">أحدث الطلبات</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      آخر الطلبات المسجلة في قاعدة البيانات.
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="rounded-md">
                    <Link href="/dashboard/orders">عرض الكل</Link>
                  </Button>
                </div>

                {stats.recentOrders.length === 0 ? (
                  <EmptyPanel
                    title="لا توجد طلبات بعد"
                    description="ستظهر الطلبات الجديدة هنا فور وصولها."
                  />
                ) : (
                  <>
                    <div className="mt-4 hidden overflow-x-auto lg:block">
                      <table className="w-full text-sm">
                        <thead className="border-b border-slate-100 text-xs text-slate-500">
                          <tr>
                            <th className="py-2 text-right font-medium">رقم الطلب</th>
                            <th className="py-2 text-right font-medium">العميل</th>
                            <th className="py-2 text-right font-medium">الإجمالي</th>
                            <th className="py-2 text-right font-medium">الحالة</th>
                            <th className="py-2 text-right font-medium">الوقت</th>
                            <th className="py-2 text-left font-medium">عرض</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {stats.recentOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50/70">
                              <td className="py-3 font-medium">#{order.orderNumber}</td>
                              <td className="py-3">
                                <p className="font-medium text-slate-900">
                                  {order.customerName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {order.customerPhone}
                                </p>
                              </td>
                              <td className="py-3 font-semibold">
                                {formatIqd(order.total)}
                              </td>
                              <td className="py-3">
                                <OrderStatusBadge status={order.status} />
                              </td>
                              <td className="py-3 text-xs text-slate-500">
                                {formatRelativeTime(order.createdAt)}
                              </td>
                              <td className="py-3 text-left">
                                <Link
                                  href={`/dashboard/orders/${order.id}`}
                                  className="text-xs font-semibold text-slate-700 hover:text-slate-950"
                                >
                                  التفاصيل
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 divide-y divide-slate-100 lg:hidden">
                      {stats.recentOrders.map((order) => (
                        <Link
                          key={order.id}
                          href={`/dashboard/orders/${order.id}`}
                          className="block py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">#{order.orderNumber}</p>
                              <p className="mt-1 text-sm text-slate-600">
                                {order.customerName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {order.customerPhone}
                              </p>
                            </div>
                            <OrderStatusBadge status={order.status} />
                          </div>
                          <div className="mt-3 flex items-center justify-between text-sm">
                            <span className="font-semibold">{formatIqd(order.total)}</span>
                            <span className="text-xs text-slate-500">
                              {formatRelativeTime(order.createdAt)}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white shadow-none">
              <CardContent className="p-4">
                <div>
                  <h2 className="font-semibold">آخر 7 أيام</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    مبيعات الطلبات التي تم توصيلها فقط.
                  </p>
                </div>
                <div className="mt-4 flex h-40 items-end gap-2">
                  {stats.dailySales.map((day) => {
                    const total = Number(day.total);
                    const height = Math.max((total / maxDailySales) * 100, total > 0 ? 8 : 2);

                    return (
                      <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-28 w-full items-end rounded-md bg-slate-50 px-1">
                          <div
                            className="w-full rounded-md bg-slate-800"
                            style={{ height: `${height}%` }}
                            title={formatIqd(day.total)}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{day.label}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-5">
            <Card className="rounded-lg border-slate-200 bg-white shadow-none">
              <CardContent className="p-4">
                <h2 className="font-semibold">إجراءات سريعة</h2>
                <div className="mt-4 grid gap-2">
                  <QuickAction href="/dashboard/products/new" icon={PackagePlus}>
                    إضافة منتج
                  </QuickAction>
                  <QuickAction href="/dashboard/orders?status=PENDING" icon={ClipboardList}>
                    الطلبات الجديدة
                  </QuickAction>
                  <QuickAction href="/dashboard/products?stockStatus=low" icon={AlertTriangle}>
                    المخزون المنخفض
                  </QuickAction>
                  <QuickAction href="/dashboard/products" icon={Boxes}>
                    إدارة المنتجات
                  </QuickAction>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white shadow-none">
              <CardContent className="p-4">
                <h2 className="font-semibold">يحتاج انتباهك</h2>
                <div className="mt-4 space-y-3">
                  {stats.pendingOrders > 0 && (
                    <AttentionItem
                      href="/dashboard/orders?status=PENDING"
                      label="طلبات جديدة"
                      value={stats.pendingOrders}
                    />
                  )}
                  {stats.lowStockProducts > 0 && (
                    <AttentionItem
                      href="/dashboard/products?stockStatus=low"
                      label="منتجات منخفضة المخزون"
                      value={stats.lowStockProducts}
                    />
                  )}
                  {stats.outOfStockProducts > 0 && (
                    <AttentionItem
                      href="/dashboard/products?stockStatus=out"
                      label="منتجات نفدت من المخزون"
                      value={stats.outOfStockProducts}
                    />
                  )}
                  {stats.pendingOrders === 0 &&
                    stats.lowStockProducts === 0 &&
                    stats.outOfStockProducts === 0 && (
                      <p className="rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-500">
                        لا توجد تنبيهات تشغيلية حالياً.
                      </p>
                    )}
                </div>
              </CardContent>
            </Card>

            {stats.lowStockPreview.length > 0 && (
              <Card className="rounded-lg border-slate-200 bg-white shadow-none">
                <CardContent className="p-4">
                  <h2 className="font-semibold">أقل مخزون</h2>
                  <div className="mt-4 divide-y divide-slate-100">
                    {stats.lowStockPreview.map((product) => (
                      <div key={product.id} className="flex items-center justify-between py-2">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-slate-500">
                          {formatQuantity(product.stock)} / {formatQuantity(product.lowStockAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function DashboardMetricCard({
  href,
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  href: string;
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "sky" | "emerald" | "amber" | "red";
}) {
  const tones = {
    sky: "bg-sky-50 text-sky-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <Link href={href} className="block">
      <Card className="rounded-lg border-slate-200 bg-white shadow-none transition hover:border-slate-300">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <p className="mt-2 truncate text-2xl font-semibold text-slate-950">
                {value}
              </p>
              <p className="mt-1 truncate text-xs text-slate-500">{hint}</p>
            </div>
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-md ${tones[tone]}`}>
              <Icon className="size-4" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickAction({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex h-10 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
    >
      <Icon className="size-4 text-slate-500" />
      {children}
    </Link>
  );
}

function AttentionItem({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm transition hover:bg-slate-100"
    >
      <span className="font-medium text-slate-700">{label}</span>
      <span className="font-semibold text-slate-950">
        {value.toLocaleString("ar-IQ")}
      </span>
    </Link>
  );
}

function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-4 rounded-md border border-dashed border-slate-200 px-4 py-10 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function comparisonLabel(current: number, previous: number) {
  if (previous === 0 && current === 0) return "لا تغيير عن أمس";
  if (previous === 0) return "نشاط جديد اليوم";

  const change = ((current - previous) / previous) * 100;
  const prefix = change >= 0 ? "+" : "";

  return `${prefix}${Math.round(change).toLocaleString("ar-IQ")}% مقارنة بأمس`;
}
