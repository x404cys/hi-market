import { PhoneActions } from "@/components/orders/phone-actions";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import {
  OrderStatusControl,
  QuickNextStatusButton,
} from "@/components/orders/order-status-control";
import { StoreProductImage } from "@/components/store/shared/product-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/api-response";
import { requirePagePermission } from "@/lib/auth/guards";
import {
  formatOrderDate,
  formatOrderTime,
  orderStatusLabels,
} from "@/lib/orders/order-format";
import { formatIqd, formatQuantity, productUnitLabels } from "@/lib/products/product-format";
import { getOrder } from "@/lib/services/order.service";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePagePermission("orders.read");
  const canUpdateStatus = user.permissions.includes("orders.updateStatus");
  const canCancel = user.permissions.includes("orders.cancel");
  const { id } = await params;
  const order = await loadOrder(id);

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <Button asChild variant="outline" size="icon-sm" className="mt-1 rounded-md">
              <Link href="/dashboard/orders" aria-label="العودة للطلبات">
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-normal">
                  طلب #{order.orderNumber}
                </h1>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {formatOrderDate(order.createdAt)} - {formatOrderTime(order.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <OrderStatusControl
              orderId={order.id}
              status={order.status}
              canUpdateStatus={canUpdateStatus}
              canCancel={canCancel}
            />
            <QuickNextStatusButton
              orderId={order.id}
              status={order.status}
              canUpdateStatus={canUpdateStatus}
            />
            <PhoneActions phone={order.customerPhone} />
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <section className="space-y-5">
            <Card className="rounded-lg border-slate-200 bg-white shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">المنتجات</h2>
                  <span className="text-xs text-slate-500">
                    {order.items.length.toLocaleString("ar-IQ")} منتجات
                  </span>
                </div>
                <div className="mt-4 divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-3">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200">
                        <StoreProductImage
                          src={item.image}
                          alt={item.productName}
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-950">
                          {item.productName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatQuantity(item.quantity)} {productUnitLabels[item.unit]} ×{" "}
                          {formatIqd(item.unitPrice)}
                        </p>
                        {item.sku && (
                          <p className="mt-1 text-xs text-slate-400">SKU: {item.sku}</p>
                        )}
                      </div>
                      <p className="text-sm font-semibold">{formatIqd(item.total)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white shadow-none">
              <CardContent className="p-4">
                <h2 className="font-semibold">ملخص المبلغ</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <TotalRow label="المجموع الفرعي" value={formatIqd(order.subtotal)} />
                  {order.discountTotal !== "0" && (
                    <TotalRow label="الخصم" value={`-${formatIqd(order.discountTotal)}`} />
                  )}
                  <TotalRow label="التوصيل" value={formatIqd(order.deliveryFee)} />
                  <TotalRow label="الضريبة" value={formatIqd(order.taxTotal)} />
                  <div className="border-t border-slate-100 pt-3">
                    <TotalRow
                      label="الإجمالي"
                      value={formatIqd(order.total)}
                      strong
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white shadow-none">
              <CardContent className="p-4">
                <h2 className="font-semibold">سجل حالة الطلب</h2>
                {order.statusHistory.length === 0 ? (
                  <p className="mt-4 rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-500">
                    لا يوجد سجل حالة لهذا الطلب.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {order.statusHistory.map((history) => (
                      <div key={history.id} className="flex gap-3">
                        <div className="mt-1 size-2 rounded-full bg-slate-400" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {orderStatusLabels[history.toStatus]}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatOrderDate(history.createdAt)} -{" "}
                            {formatOrderTime(history.createdAt)}
                          </p>
                          {history.note && (
                            <p className="mt-1 text-xs text-slate-500">
                              {history.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-5">
            <Card className="rounded-lg border-slate-200 bg-white shadow-none">
              <CardContent className="p-4">
                <h2 className="font-semibold">معلومات العميل</h2>
                <div className="mt-4 space-y-3">
                  <InfoRow label="الاسم" value={order.customerName} />
                  <InfoRow label="الهاتف" value={order.customerPhone} />
                  <InfoRow label="الهاتف الثاني" value={order.secondaryPhone} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white shadow-none">
              <CardContent className="p-4">
                <h2 className="font-semibold">عنوان التوصيل</h2>
                <div className="mt-4 space-y-3">
                  <InfoRow label="منطقة التوصيل" value={order.deliveryZoneName} />
                  <InfoRow label="المحافظة" value={order.governorate} />
                  <InfoRow label="المدينة" value={order.city} />
                  <InfoRow label="المنطقة" value={order.area} />
                  <InfoRow label="الشارع" value={order.street} />
                  <InfoRow label="العنوان" value={order.address} />
                  <InfoRow label="أقرب نقطة دالة" value={order.landmark} />
                </div>
              </CardContent>
            </Card>

            {order.customerNotes && (
              <Card className="rounded-lg border-amber-200 bg-amber-50 shadow-none">
                <CardContent className="p-4">
                  <h2 className="font-semibold text-amber-950">ملاحظات العميل</h2>
                  <p className="mt-2 text-sm leading-6 text-amber-900">
                    {order.customerNotes}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-lg border-slate-200 bg-white shadow-none">
              <CardContent className="p-4">
                <h2 className="font-semibold">بيانات الطلب</h2>
                <div className="mt-4 space-y-3">
                  <InfoRow label="طريقة الدفع" value="الدفع عند الاستلام" />
                  <InfoRow label="رمز الخصم" value={order.couponCode} />
                  <InfoRow label="حالة الدفع" value={paymentStatusLabel(order.paymentStatus)} />
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}

async function loadOrder(id: string) {
  try {
    return await getOrder(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}

function TotalRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${strong ? "text-base font-bold" : ""}`}>
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;

  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function paymentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "قيد الانتظار",
    PAID: "مدفوع",
    FAILED: "فشل الدفع",
    REFUNDED: "مسترجع",
  };

  return labels[status] ?? status;
}
