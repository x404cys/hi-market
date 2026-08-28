"use client";

import { Button } from "@/components/ui/button";
import { Copy, MessageCircle } from "lucide-react";
import { useState } from "react";

export function PhoneActions({ phone }: { phone: string }) {
  const [copied, setCopied] = useState(false);
  const whatsappPhone = normalizeWhatsappPhone(phone);

  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={copyPhone}
        className="h-9 gap-2 rounded-md"
      >
        <Copy className="size-4" />
        {copied ? "تم النسخ" : "نسخ الرقم"}
      </Button>
      {whatsappPhone && (
        <Button asChild className="h-9 gap-2 rounded-md">
          <a href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noreferrer">
            <MessageCircle className="size-4" />
            واتساب العميل
          </a>
        </Button>
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
