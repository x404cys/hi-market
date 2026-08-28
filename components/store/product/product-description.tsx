"use client";

import { useState } from "react";

export function ProductDescription({ description }: { description?: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const text = description?.trim() || "لا يوجد وصف تفصيلي لهذا المنتج حالياً.";
  const shouldClamp = text.length > 135;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-bold text-[var(--store-text)]">تفاصيل المنتج</h2>
      <p
        className={`text-xs leading-5 text-[var(--store-text-muted)] ${
          !expanded && shouldClamp ? "line-clamp-3" : ""
        }`}
      >
        {text}
      </p>
      {shouldClamp && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="text-xs font-bold text-[var(--store-primary)] underline underline-offset-2"
        >
          {expanded ? "عرض أقل" : "عرض المزيد"}
        </button>
      )}
    </section>
  );
}
