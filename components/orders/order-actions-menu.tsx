"use client";

import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function OrderActionsMenu({
  orderId,
  customerPhone,
}: {
  orderId: string;
  customerPhone: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const whatsappPhone = normalizeWhatsappPhone(customerPhone);

  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(customerPhone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="relative flex justify-end">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="إجراءات الطلب"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <MoreHorizontal className="size-4" />
      </Button>

      {isOpen && (
        <div className="absolute left-0 top-9 z-20 w-40 overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-sm shadow-lg">
          <Link
            href={`/dashboard/orders/${orderId}`}
            className="flex items-center gap-2 rounded px-2 py-2 text-slate-700 hover:bg-slate-50"
          >
            <ExternalLink className="size-4" />
            عرض التفاصيل
          </Link>
          <button
            type="button"
            onClick={copyPhone}
            className="flex w-full items-center gap-2 rounded px-2 py-2 text-slate-700 hover:bg-slate-50"
          >
            <Copy className="size-4" />
            {copied ? "تم النسخ" : "نسخ الرقم"}
          </button>
          {whatsappPhone && (
            <a
              href={`https://wa.me/${whatsappPhone}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded px-2 py-2 text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink className="size-4" />
              واتساب العميل
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function normalizeWhatsappPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `964${digits.slice(1)}`;

  return digits;
}
