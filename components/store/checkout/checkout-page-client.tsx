"use client";

import { ArrowRight, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BottomNavigation } from "@/components/store/layout/bottom-navigation";
import { StoreProductImage } from "@/components/store/shared/product-image";
import { clearCart, useCartState, useCartSummary } from "@/features/cart/store";
import type { CartItem } from "@/features/cart/types";
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

const configuredWhatsappPhone = "+9647763920232";
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

  useEffect(() => {
    if (!submitError && Object.keys(fieldErrors).length === 0) return;

    window.setTimeout(() => {
      document
        .querySelector("[data-checkout-error='true']")
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 50);
  }, [fieldErrors, submitError]);

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
        throw new Error(translateCheckoutError(json.message, nextFieldErrors, cart.items));
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
          <section className="rounded-xl border border-emerald-100 bg-white px-5 py-8 text-center">
            <CheckCircle2 className="mx-auto size-10 text-[var(--store-primary)]" />
            <h1 className="mt-4 text-xl font-semibold">تم استلام طلبك</h1>
            <p className="mt-2 text-sm text-[var(--store-text-muted)]">
              طلب {getDisplayOrderNumber(createdOrder.orderNumber)}
            </p>
            <div className="mt-5 space-y-2 rounded-lg border border-[var(--store-border)] bg-slate-50 px-4 py-3 text-right text-sm">
              <SummaryLine label="الهاتف" value={createdOrder.customerPhone} />
              <SummaryLine label="العنوان" value={createdOrder.address} />
              <SummaryLine label="الإجمالي" value={formatIqd(createdOrder.total)} strong />
            </div>
            <button
              type="button"
              onClick={() => openWhatsappOrder(createdOrder)}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-[var(--store-primary)] text-sm font-semibold text-white transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200"
            >
              إرسال عبر واتساب
            </button>
            <Link
              href="/"
              className="mt-3 flex h-11 w-full items-center justify-center rounded-lg border border-[var(--store-border)] bg-white text-sm font-semibold transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-100"
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
            className="flex size-10 items-center justify-center rounded-lg bg-white text-[var(--store-text)] ring-1 ring-[var(--store-border)]"
            aria-label="العودة للسلة"
          >
            <ArrowRight className="size-4" />
          </Link>
          <div>
            <p className="text-xs text-[var(--store-text-muted)]">الدفع عند الاستلام</p>
            <h1 className="text-xl font-semibold">إتمام الطلب</h1>
          </div>
        </header>

        {cart.items.length === 0 ? (
          <section className="rounded-xl border border-[var(--store-border)] bg-white px-5 py-10 text-center">
            <p className="text-sm font-semibold">السلة فارغة</p>
            <Link
              href="/"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[var(--store-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200"
            >
              العودة للتسوق
            </Link>
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]"
          >
            <section className="space-y-4 rounded-xl border border-[var(--store-border)] bg-white p-4">
              <h2 className="text-base font-semibold">معلومات التوصيل</h2>
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
                <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  <span>{zonesError}</span>
                  <button
                    type="button"
                    onClick={() => void loadDeliveryZones()}
                    className="inline-flex min-h-10 items-center gap-1 rounded-md px-2 font-semibold transition hover:bg-amber-100"
                  >
                    <RefreshCw className="size-3" />
                    إعادة المحاولة
                  </button>
                </div>
              )}
              {selectedZone && (
                <div className="rounded-lg bg-[var(--store-primary-soft)] px-3 py-2 text-xs text-[var(--store-primary-strong)]">
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
              <section className="rounded-xl border border-[var(--store-border)] bg-white p-4">
                <h2 className="text-base font-semibold">ملخص الطلب</h2>
                <div className="mt-4 space-y-3">
                  {cart.items.map((item) => (
                    <div key={item.productId} className="flex gap-3">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-[var(--store-primary-soft)]">
                        <StoreProductImage
                          src={item.image}
                          alt={item.name}
                          sizes="56px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{item.name}</p>
                        <p className="mt-1 text-[11px] text-[var(--store-text-muted)]">
                          {formatQuantity(item.quantity)} {productUnitLabels[item.unit]}
                        </p>
                      </div>
                      <p className="text-xs font-semibold">
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

              <section className="rounded-xl border border-[var(--store-border)] bg-white p-4">
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
                <div
                  data-checkout-error="true"
                  className="space-y-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600"
                >
                  <p className="font-semibold">تعذر إتمام الطلب</p>
                  <p>{submitError}</p>
                  {submitStatus && isDevelopment && (
                    <p className="text-xs">HTTP: {submitStatus}</p>
                  )}
                  {getCartLevelErrors(fieldErrors, cart.items).map((message) => (
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
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--store-primary)] text-sm font-semibold text-white transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {isSubmitting ? "جاري تأكيد الطلب..." : "إتمام الطلب"}
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
  const displayOrderNumber = getDisplayOrderNumber(order.orderNumber);
  const lines = [
    "طلب جديد - Hi Market",
    "",
    `رقم الطلب: ${displayOrderNumber}`,
    `التاريخ: ${formatOrderDateTime(order.placedAt)}`,
    "",
    "معلومات الزبون",
    `الاسم: ${order.customerName}`,
    `الهاتف: ${order.customerPhone}`,
    order.secondaryPhone ? `الهاتف البديل: ${order.secondaryPhone}` : null,
    `العنوان: ${buildOrderAddress(order)}`,
    order.landmark ? `علامة دالة: ${order.landmark}` : null,
    "",
    `المبلغ الإجمالي: ${formatIqd(order.total)}`,
    "",
    `يرجى اعتماد رقم الطلب ${displayOrderNumber} للمتابعة.`,
  ];

  return lines.filter(Boolean).join("\n");
}

function getDisplayOrderNumber(orderNumber: number) {
  return `HM-${orderNumber}`;
}

function formatOrderDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  const day = padDatePart(date.getDate());
  const month = padDatePart(date.getMonth() + 1);
  const year = date.getFullYear();
  let hour = date.getHours();
  const minutes = padDatePart(date.getMinutes());
  const meridiem = hour < 12 ? "ص" : "م";

  hour %= 12;
  if (hour === 0) hour = 12;

  return `${day}/${month}/${year} - ${padDatePart(hour)}:${minutes} ${meridiem}`;
}

function padDatePart(value: number) {
  return value.toString().padStart(2, "0");
}

function buildOrderAddress(order: OrderDto) {
  const parts = [
    order.governorate,
    order.city,
    order.area,
    order.street,
    order.address,
  ];
  const seen = new Set<string>();

  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .filter((part) => {
      const normalized = part.replace(/\s+/g, " ").toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .join(" - ");
}

function emptyToUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeWhatsappPhone(value: string | undefined) {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length >= 8 ? digits : null;
}

function translateCheckoutError(
  message: string,
  errors: CheckoutFieldErrors,
  cartItems: CartItem[],
) {
  const itemMessages = getCartLevelErrors(errors, cartItems);

  if (itemMessages.length > 0) return itemMessages[0];
  if (message === "Validation failed") return "تحقق من الحقول المطلوبة ثم حاول مرة أخرى.";
  if (message.toLowerCase().includes("stock")) {
    return "تغير توفر أحد المنتجات. عدّل السلة ثم حاول مرة أخرى.";
  }

  return message || "حدثت مشكلة أثناء حفظ الطلب. يمكنك المحاولة مرة أخرى.";
}

function SummaryLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[var(--store-text-muted)]">{label}</span>
      <span
        className={
          strong
            ? "font-semibold text-[var(--store-text)]"
            : "max-w-[70%] text-left text-[var(--store-text)]"
        }
      >
        {value}
      </span>
    </div>
  );
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
  const hasError = Boolean(error?.length);

  return (
    <label className="block" data-checkout-error={hasError ? "true" : undefined}>
      <span className="mb-1.5 block text-xs font-semibold text-[var(--store-text)]">
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
    <details className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <summary className="cursor-pointer font-semibold">تفاصيل الخطأ للمطور</summary>
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
            <p className="font-semibold">Validation issues</p>
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
      <span className="font-semibold">{label}: </span>
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

function getCartLevelErrors(errors: CheckoutFieldErrors, cartItems: CartItem[]) {
  return Object.entries(errors)
    .filter(([field]) => field === "items" || field.startsWith("items."))
    .flatMap(([, messages]) =>
      messages.map((message) => translateCartErrorMessage(message, cartItems)),
    );
}

function translateCartErrorMessage(message: string, cartItems: CartItem[]) {
  const product = cartItems.find((item) => message.includes(item.productId));
  const productName = product?.name ?? "أحد المنتجات";

  if (message.includes("Insufficient stock")) {
    return `${productName} لم يعد متوفراً بالكمية المطلوبة.`;
  }

  if (message.includes("status is")) {
    return `${productName} غير متوفر حالياً.`;
  }

  if (message.includes("Quantity is below minimum")) {
    return `كمية ${productName} أقل من الحد الأدنى.`;
  }

  if (message.includes("Quantity does not match order step")) {
    return `كمية ${productName} لا تطابق خطوة الطلب المسموحة.`;
  }

  if (message.includes("was not found")) {
    return `${productName} لم يعد متاحاً في المتجر.`;
  }

  return "تعذر تأكيد أحد منتجات السلة. عدّل السلة ثم حاول مرة أخرى.";
}

const inputClass =
  "h-11 w-full rounded-lg border border-[var(--store-border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--store-primary)] focus:ring-3 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-[var(--store-muted)]";
