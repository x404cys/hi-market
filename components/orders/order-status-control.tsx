"use client";

import type { OrderStatus } from "@/app/generated/prisma";
import { Button } from "@/components/ui/button";
import { orderStatusLabels, orderStatusOptions } from "@/lib/orders/order-format";
import type { ApiErrorResponse, ApiSuccess } from "@/lib/products/product-types";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const nextStatuses: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function OrderStatusControl({
  orderId,
  status,
  compact = false,
}: {
  orderId: string;
  status: OrderStatus;
  compact?: boolean;
}) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allowed = useMemo(
    () => new Set<OrderStatus>([status, ...nextStatuses[status]]),
    [status],
  );

  async function updateStatus(nextStatus: OrderStatus) {
    setSelectedStatus(nextStatus);
    setMessage(null);
    setError(null);

    if (nextStatus === status) return;

    const isCancellation = nextStatus === "CANCELLED";
    if (
      isCancellation &&
      !window.confirm(
        "إلغاء الطلب؟\nسيتم إلغاء الطلب وإرجاع الكميات إلى المخزون إذا كانت قد خُصمت.",
      )
    ) {
      setSelectedStatus(status);
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = (await response.json()) as
        | ApiSuccess<unknown>
        | ApiErrorResponse;

      if (!json.success) {
        setSelectedStatus(status);
        setError(json.message || "تعذر تحديث حالة الطلب");
        return;
      }

      setMessage("تم تحديث حالة الطلب");
      router.refresh();
    } catch {
      setSelectedStatus(status);
      setError("تعذر الاتصال بواجهة الطلبات");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <label className="sr-only">حالة الطلب</label>
      <div className="flex items-center gap-2">
        <select
          value={selectedStatus}
          disabled={isUpdating || nextStatuses[status].length === 0}
          onChange={(event) => updateStatus(event.target.value as OrderStatus)}
          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        >
          {orderStatusOptions.map((option) => (
            <option key={option} value={option} disabled={!allowed.has(option)}>
              {orderStatusLabels[option]}
            </option>
          ))}
        </select>
        {isUpdating && <Loader2 className="size-3.5 animate-spin text-slate-400" />}
      </div>
      {message && (
        <p className="flex items-center gap-1 text-xs text-emerald-700">
          <CheckCircle2 className="size-3" />
          {message}
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function QuickNextStatusButton({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const next = nextStatuses[status].find((item) => item !== "CANCELLED");

  if (!next) return null;

  return (
    <OrderStatusActionButton
      orderId={orderId}
      status={status}
      nextStatus={next}
      label={quickStatusLabel(next)}
    />
  );
}

function OrderStatusActionButton({
  orderId,
  status,
  nextStatus,
  label,
}: {
  orderId: string;
  status: OrderStatus;
  nextStatus: OrderStatus;
  label: string;
}) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus() {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = (await response.json()) as
        | ApiSuccess<unknown>
        | ApiErrorResponse;

      if (!json.success) {
        setError(json.message || "تعذر تحديث حالة الطلب");
        return;
      }

      router.refresh();
    } catch {
      setError("تعذر الاتصال بواجهة الطلبات");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        disabled={isUpdating || status === nextStatus}
        onClick={updateStatus}
        className="h-9 rounded-md px-3"
      >
        {isUpdating ? "جاري التحديث..." : label}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function quickStatusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    PENDING: "إرجاع لجديد",
    CONFIRMED: "تأكيد الطلب",
    PREPARING: "بدء التجهيز",
    READY: "جاهز",
    OUT_FOR_DELIVERY: "إرساله للتوصيل",
    DELIVERED: "تم التوصيل",
    CANCELLED: "إلغاء",
  };

  return labels[status];
}
