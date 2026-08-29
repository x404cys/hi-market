"use client";

import { ArrowRight, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BottomNavigation } from "@/components/store/layout/bottom-navigation";
import { StoreProductImage } from "@/components/store/shared/product-image";
import { clearCart, useCartState, useCartSummary } from "@/features/cart/store";
import type { DeliveryZoneDto } from "@/lib/delivery/delivery-types";
import type { OrderDto } from "@/lib/orders/order-types";
import type { ApiErrorResponse, ApiSuccess } from "@/lib/products/product-types";
import {
  formatIqd,
  formatQuantity,
  productUnitLabels,
} from "@/lib/products/product-format";

type CheckoutFormState = {
  customerName: string;
  customerPhone: string;
  secondaryPhone: string;
  deliveryZoneId: string;
  governorate: string;
  city: string;
  area: string;
  street: string;
  address: string;
  landmark: string;
  customerNotes: string;
  couponCode: string;
};

type CheckoutFieldErrors = Record<string, string[]>;

const initialFormState: CheckoutFormState = {
  customerName: "",
  customerPhone: "",
  secondaryPhone: "",
  deliveryZoneId: "",
  governorate: "",
  city: "",
  area: "",
  street: "",
  address: "",
  landmark: "",
  customerNotes: "",
  couponCode: "",
};

const configuredWhatsappPhone =
  process.env.NEXT_PUBLIC_STORE_WHATSAPP_PHONE ?? "+9647763920232";
const storeWhatsappPhone = normalizeWhatsappPhone(configuredWhatsappPhone);
const isDevelopment = process.env.NODE_ENV !== "production";

export function CheckoutPageClient() {
  const cart = useCartState();
  const { total } = useCartSummary();
  const [form, setForm] = useState(initialFormState);
  const [zones, setZones] = useState<DeliveryZoneDto[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zonesError, setZonesError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [debugResponse, setDebugResponse] = useState<ApiErrorResponse | null>(null);
  const [createdOrder, setCreatedOrder] = useState<OrderDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedZone = useMemo(
    () => zones.find((zone) => zone.id === form.deliveryZoneId) ?? null,
    [form.deliveryZoneId, zones],
  );

  useEffect(() => {
    void loadDeliveryZones();
  }, []);

  async function loadDeliveryZones() {
    setZonesLoading(true);
    setZonesError(null);

    try {
      const response = await fetch("/api/delivery-zones");
      const json =
        (await response.json()) as ApiSuccess<DeliveryZoneDto[]> | ApiErrorResponse;

      if (!json.success) {
        throw new Error(json.message);
      }

      setZones(json.data);
    } catch {
      setZones([]);
      setZonesError("تعذر تحميل مناطق التوصيل.");
    } finally {
      setZonesLoading(false);
    }
  }

  function setField<K extends keyof CheckoutFormState>(
    key: K,
    value: CheckoutFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
    setSubmitError(null);
    setSubmitStatus(null);
    setDebugResponse(null);
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || cart.items.length === 0) return;

    if (!storeWhatsappPhone) {
      setSubmitError("رقم واتساب المتجر غير مضبوط.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitStatus(null);
    setFieldErrors({});
    setDebugResponse(null);

    try {
      const payload = {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        secondaryPhone: emptyToUndefined(form.secondaryPhone),
        deliveryZoneId: form.deliveryZoneId || null,
        governorate: emptyToUndefined(form.governorate),
        city: emptyToUndefined(form.city),
        area: emptyToUndefined(form.area),
        street: emptyToUndefined(form.street),
        address: form.address,
        landmark: emptyToUndefined(form.landmark),
        customerNotes: emptyToUndefined(form.customerNotes),
        couponCode: emptyToUndefined(form.couponCode),
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity.toString(),
        })),
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let json: ApiSuccess<OrderDto> | ApiErrorResponse;

      try {
        json = (await response.json()) as ApiSuccess<OrderDto> | ApiErrorResponse;
      } catch {
        throw new Error(`تعذر قراءة استجابة الخادم. HTTP: ${response.status}`);
      }

      if (!json.success) {
        const nextFieldErrors = extractFieldErrors(json.errors);
        setFieldErrors(nextFieldErrors);
        setSubmitStatus(response.status);
        setDebugResponse(json);
        throw new Error(json.message);
      }

      setCreatedOrder(json.data);
      clearCart();
      openWhatsappOrder(json.data);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "تعذر إتمام الطلب حالياً.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (createdOrder) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[var(--store-background)] px-5 pb-28 pt-5 text-[var(--store-text)]"
      >
        <div className="mx-auto max-w-md md:max-w-3xl">
          <section className="rounded-[18px] border border-emerald-100 bg-white px-5 py-8 text-center shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            <CheckCircle2 className="mx-auto size-10 text-[var(--store-primary)]" />
            <h1 className="mt-4 text-xl font-bold">تم إنشاء الطلب</h1>
            <p className="mt-2 text-sm text-[var(--store-text-muted)]">
              رقم الطلب #{createdOrder.orderNumber}. افتح واتساب لإرسال تفاصيل الطلب
              إلى المتجر.
            </p>
            <button
              type="button"
              onClick={() => openWhatsappOrder(createdOrder)}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-[12px] bg-[var(--store-primary)] text-sm font-bold text-white"
            >
              فتح واتساب مرة أخرى
            </button>
            <Link
              href="/"
              className="mt-3 flex h-11 w-full items-center justify-center rounded-[12px] border border-[var(--store-border)] bg-white text-sm font-bold"
            >
              العودة للتسوق
            </Link>
          </section>
        </div>
        <BottomNavigation />
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--store-background)] px-5 pb-28 pt-5 text-[var(--store-text)]"
    >
      <div className="mx-auto max-w-md space-y-5 md:max-w-5xl">
        <header className="flex items-center gap-3">
          <Link
            href="/cart"
            className="flex size-9 items-center justify-center rounded-full bg-white text-[var(--store-text)] ring-1 ring-[var(--store-border)]"
            aria-label="العودة للسلة"
          >
            <ArrowRight className="size-4" />
          </Link>
          <div>
            <p className="text-xs text-[var(--store-text-muted)]">الدفع عند الاستلام</p>
            <h1 className="text-xl font-bold">إتمام الطلب</h1>
          </div>
        </header>

        {cart.items.length === 0 ? (
          <section className="rounded-[18px] border border-[var(--store-border)] bg-white px-5 py-10 text-center">
            <p className="text-sm font-bold">السلة فارغة</p>
            <Link
              href="/"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-[10px] bg-[var(--store-primary)] px-4 text-sm font-bold text-white"
            >
              العودة للتسوق
            </Link>
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]"
          >
            <section className="space-y-4 rounded-[18px] border border-[var(--store-border)] bg-white p-4">
              <h2 className="text-base font-bold">معلومات التوصيل</h2>
              <Field label="الاسم الكامل" required error={fieldErrors.customerName}>
                <input
                  value={form.customerName}
                  onChange={(event) => setField("customerName", event.target.value)}
                  className={inputClass}
                  autoComplete="name"
                  required
                />
              </Field>
              <Field label="رقم الهاتف" required error={fieldErrors.customerPhone}>
                <input
                  value={form.customerPhone}
                  onChange={(event) => setField("customerPhone", event.target.value)}
                  className={inputClass}
                  inputMode="tel"
                  autoComplete="tel"
                  required
                />
              </Field>
              <Field label="رقم بديل" error={fieldErrors.secondaryPhone}>
                <input
                  value={form.secondaryPhone}
                  onChange={(event) => setField("secondaryPhone", event.target.value)}
                  className={inputClass}
                  inputMode="tel"
                />
              </Field>

              <Field label="منطقة التوصيل" error={fieldErrors.deliveryZoneId}>
                <select
                  value={form.deliveryZoneId}
                  onChange={(event) => setField("deliveryZoneId", event.target.value)}
                  className={inputClass}
                  disabled={zonesLoading}
                >
                  <option value="">
                    {zonesLoading
                      ? "جاري تحميل المناطق..."
                      : zones.length > 0
                        ? "اختر المنطقة"
                        : "بدون منطقة محددة"}
                  </option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </Field>
              {zonesError && (
                <div className="flex items-center justify-between rounded-[12px] bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  <span>{zonesError}</span>
                  <button
                    type="button"
                    onClick={() => void loadDeliveryZones()}
                    className="inline-flex items-center gap-1 font-bold"
                  >
                    <RefreshCw className="size-3" />
                    إعادة المحاولة
                  </button>
                </div>
              )}
              {selectedZone && (
                <div className="rounded-[12px] bg-[var(--store-primary-soft)] px-3 py-2 text-xs text-[var(--store-primary-strong)]">
                  رسوم التوصيل {formatIqd(selectedZone.fee)}
                  {selectedZone.freeDeliveryFrom
                    ? `، توصيل مجاني للطلبات من ${formatIqd(selectedZone.freeDeliveryFrom)}`
                    : ""}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="المحافظة" error={fieldErrors.governorate}>
                  <input
                    value={form.governorate}
                    onChange={(event) => setField("governorate", event.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="المدينة" error={fieldErrors.city}>
                  <input
                    value={form.city}
                    onChange={(event) => setField("city", event.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="المنطقة" error={fieldErrors.area}>
                  <input
                    value={form.area}
                    onChange={(event) => setField("area", event.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="الشارع" error={fieldErrors.street}>
                  <input
                    value={form.street}
                    onChange={(event) => setField("street", event.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="العنوان التفصيلي" required error={fieldErrors.address}>
                <textarea
                  value={form.address}
                  onChange={(event) => setField("address", event.target.value)}
                  className={`${inputClass} min-h-24 py-2`}
                  required
                />
              </Field>
              <Field label="أقرب نقطة دالة" error={fieldErrors.landmark}>
                <input
                  value={form.landmark}
                  onChange={(event) => setField("landmark", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="ملاحظات" error={fieldErrors.customerNotes}>
                <textarea
                  value={form.customerNotes}
                  onChange={(event) => setField("customerNotes", event.target.value)}
                  className={`${inputClass} min-h-20 py-2`}
                />
              </Field>
            </section>

            <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
              <section className="rounded-[18px] border border-[var(--store-border)] bg-white p-4">
                <h2 className="text-base font-bold">ملخص الطلب</h2>
                <div className="mt-4 space-y-3">
                  {cart.items.map((item) => (
                    <div key={item.productId} className="flex gap-3">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-[12px] bg-[var(--store-primary-soft)]">
                        <StoreProductImage
                          src={item.image}
                          alt={item.name}
                          sizes="56px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold">{item.name}</p>
                        <p className="mt-1 text-[11px] text-[var(--store-text-muted)]">
                          {formatQuantity(item.quantity)} {productUnitLabels[item.unit]}
                        </p>
                      </div>
                      <p className="text-xs font-bold">
                        {formatIqd(Number(item.price) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t border-[var(--store-border)] pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--store-text-muted)]">إجمالي تقديري</span>
                    <strong>{formatIqd(total)}</strong>
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-[var(--store-text-muted)]">
                    السعر النهائي ورسوم التوصيل يتم احتسابها من قاعدة البيانات عند
                    إنشاء الطلب.
                  </p>
                </div>
              </section>

              <section className="rounded-[18px] border border-[var(--store-border)] bg-white p-4">
                <Field label="كود الخصم" error={fieldErrors.couponCode}>
                  <input
                    value={form.couponCode}
                    onChange={(event) => setField("couponCode", event.target.value)}
                    className={inputClass}
                    dir="ltr"
                  />
                </Field>
              </section>

              {submitError && (
                <div className="space-y-2 rounded-[14px] border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                  <p className="font-bold">تعذر إتمام الطلب</p>
                  <p>{submitError}</p>
                  {submitStatus && isDevelopment && (
                    <p className="text-xs">HTTP: {submitStatus}</p>
                  )}
                  {getCartLevelErrors(fieldErrors).map((message) => (
                    <p key={message} className="text-xs">
                      {message}
                    </p>
                  ))}
                </div>
              )}

              <DevelopmentErrorDetails response={debugResponse} status={submitStatus} />

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[var(--store-primary)] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {isSubmitting ? "جاري إنشاء الطلب..." : "إتمام الطلب عبر واتساب"}
              </button>
            </aside>
          </form>
        )}
      </div>
      <BottomNavigation />
    </main>
  );
}

function openWhatsappOrder(order: OrderDto) {
  if (!storeWhatsappPhone) return;

  const message = buildWhatsappMessage(order);
  const url = `https://wa.me/${storeWhatsappPhone}?text=${encodeURIComponent(message)}`;
  const opened = window.open(url, "_blank");

  if (!opened) {
    window.location.href = url;
  }
}

function buildWhatsappMessage(order: OrderDto) {
  const lines = [
    `طلب جديد #${order.orderNumber}`,
    "",
    `الاسم: ${order.customerName}`,
    `الهاتف: ${order.customerPhone}`,
    order.secondaryPhone ? `هاتف بديل: ${order.secondaryPhone}` : null,
    "",
    "العنوان:",
    order.deliveryZoneName ? `منطقة التوصيل: ${order.deliveryZoneName}` : null,
    order.governorate ? `المحافظة: ${order.governorate}` : null,
    order.city ? `المدينة: ${order.city}` : null,
    order.area ? `المنطقة: ${order.area}` : null,
    order.street ? `الشارع: ${order.street}` : null,
    order.address,
    order.landmark ? `نقطة دالة: ${order.landmark}` : null,
    "",
    "المنتجات:",
    ...order.items.map(
      (item) =>
        `- ${item.productName} × ${formatQuantity(item.quantity)} ${
          productUnitLabels[item.unit]
        } = ${formatIqd(item.total)}`,
    ),
    "",
    `المجموع: ${formatIqd(order.subtotal)}`,
    order.discountTotal !== "0" ? `الخصم: ${formatIqd(order.discountTotal)}` : null,
    `التوصيل: ${formatIqd(order.deliveryFee)}`,
    `الإجمالي: ${formatIqd(order.total)}`,
    order.customerNotes ? `ملاحظات: ${order.customerNotes}` : null,
  ];

  return lines.filter(Boolean).join("\n");
}

function emptyToUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeWhatsappPhone(value: string | undefined) {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length >= 8 ? digits : null;
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-[var(--store-text)]">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {error?.map((message) => (
        <span key={message} className="mt-1 block text-xs text-red-600">
          {message}
        </span>
      ))}
    </label>
  );
}

function DevelopmentErrorDetails({
  response,
  status,
}: {
  response: ApiErrorResponse | null;
  status: number | null;
}) {
  if (!isDevelopment || !response?.debug) return null;

  const debug = response.debug;

  return (
    <details className="rounded-[14px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <summary className="cursor-pointer font-bold">تفاصيل الخطأ للمطور</summary>
      <div className="mt-3 space-y-2">
        <DebugRow label="Status" value={status ?? debug.status} />
        <DebugRow label="Route" value={debug.route} />
        <DebugRow label="Debug ID" value={response.debugId ?? debug.debugId} />
        <DebugRow label="Type" value={debug.type} />
        <DebugRow label="Category" value={debug.category} />
        <DebugRow label="Phase" value={debug.phase} />
        <DebugRow label="Last stage" value={debug.lastStage} />
        <DebugRow label="Message" value={debug.message} />
        {debug.issues && debug.issues.length > 0 && (
          <div>
            <p className="font-bold">Validation issues</p>
            <ul className="mt-1 space-y-1">
              {debug.issues.map((issue) => (
                <li key={`${issue.path}-${issue.code}-${issue.message}`}>
                  <span className="font-mono">{issue.path || "form"}</span>:{" "}
                  {issue.message} ({issue.code})
                </li>
              ))}
            </ul>
          </div>
        )}
        {debug.code && <DebugRow label="Code" value={debug.code} />}
      </div>
    </details>
  );
}

function DebugRow({ label, value }: { label: string; value: unknown }) {
  if (value === undefined || value === null || value === "") return null;

  return (
    <p>
      <span className="font-bold">{label}: </span>
      <span className="font-mono">{String(value)}</span>
    </p>
  );
}

function extractFieldErrors(errors: Record<string, unknown> | undefined) {
  if (!errors) return {};

  return Object.fromEntries(
    Object.entries(errors)
      .map(([field, value]) => [field, normalizeMessages(value)] as const)
      .filter(([, messages]) => messages.length > 0),
  );
}

function normalizeMessages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((entry) => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) return [value.trim()];

  return [];
}

function getCartLevelErrors(errors: CheckoutFieldErrors) {
  return Object.entries(errors)
    .filter(([field]) => field === "items" || field.startsWith("items."))
    .flatMap(([field, messages]) =>
      messages.map((message) => `${field}: ${message}`),
    );
}

const inputClass =
  "h-11 w-full rounded-[12px] border border-[var(--store-border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--store-primary)] focus:ring-3 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-[var(--store-muted)]";
