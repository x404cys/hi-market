"use client";

import { Button } from "@/components/ui/button";
import { createSlug } from "@/lib/products/product-format";
import type {
  ApiErrorResponse,
  ApiSuccess,
  BrandOption,
  CategoryOption,
} from "@/lib/products/product-types";
import { Loader2 } from "lucide-react";
import {
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

type QuickCreateKind = "category" | "brand";
type QuickCreateResult = CategoryOption | BrandOption;
type FieldErrors = Partial<Record<"name" | "slug" | "form", string>>;

const dialogCopy: Record<
  QuickCreateKind,
  {
    title: string;
    nameLabel: string;
    namePlaceholder: string;
    submitLabel: string;
    loadingLabel: string;
    endpoint: string;
    successMessage: string;
  }
> = {
  category: {
    title: "إضافة تصنيف",
    nameLabel: "اسم التصنيف",
    namePlaceholder: "مشروبات",
    submitLabel: "إضافة التصنيف",
    loadingLabel: "جاري الإضافة...",
    endpoint: "/api/categories",
    successMessage: "تمت إضافة التصنيف بنجاح",
  },
  brand: {
    title: "إضافة ماركة",
    nameLabel: "اسم الماركة",
    namePlaceholder: "Coca Cola",
    submitLabel: "إضافة الماركة",
    loadingLabel: "جاري الإضافة...",
    endpoint: "/api/brands",
    successMessage: "تمت إضافة الماركة بنجاح",
  },
};

export function QuickCreateCatalogDialog({
  kind,
  initialName = "",
  returnFocusRef,
  onClose,
  onCreated,
}: {
  kind: QuickCreateKind;
  initialName?: string;
  returnFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  onCreated: (item: QuickCreateResult, message: string) => void;
}) {
  const copy = dialogCopy[kind];
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(createSlug(initialName));
  const [isSlugDirty, setIsSlugDirty] = useState(Boolean(initialName));
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  function closeDialog() {
    onClose();
    window.setTimeout(() => returnFocusRef?.current?.focus(), 0);
  }

  function handleNameChange(value: string) {
    setName(value);
    setErrors((current) => ({ ...current, name: undefined, form: undefined }));

    if (!isSlugDirty) {
      setSlug(createSlug(value));
      setErrors((current) => ({ ...current, slug: undefined }));
    }
  }

  function handleSlugChange(value: string) {
    setIsSlugDirty(true);
    setSlug(createSlug(value));
    setErrors((current) => ({ ...current, slug: undefined, form: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreating) return;

    setErrors({});

    const nextErrors: FieldErrors = {};
    if (!name.trim()) nextErrors.name = "هذا الحقل مطلوب";
    if (!slug.trim()) nextErrors.slug = "هذا الحقل مطلوب";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch(copy.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
        }),
      });
      const json = (await response.json()) as
        | ApiSuccess<QuickCreateResult>
        | ApiErrorResponse;

      if (!json.success) {
        setErrors(apiErrorToFieldErrors(json, kind));
        setIsCreating(false);
        return;
      }

      onCreated(json.data, copy.successMessage);
      closeDialog();
    } catch {
      setErrors({ form: "تعذر الاتصال بالخادم. حاول مرة أخرى." });
      setIsCreating(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && !isCreating) {
      closeDialog();
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) return;

    const focusableElements = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6"
      dir="rtl"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isCreating) closeDialog();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${kind}-quick-create-title`}
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl"
        onKeyDown={handleKeyDown}
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <h2
            id={`${kind}-quick-create-title`}
            className="text-base font-semibold text-slate-950"
          >
            {copy.title}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 px-5 py-4">
          {errors.form && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
              {errors.form}
            </p>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-800">
              {copy.nameLabel} <span className="text-red-600">*</span>
            </span>
            <input
              ref={nameInputRef}
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              className={inputClass(errors.name)}
              placeholder={copy.namePlaceholder}
              disabled={isCreating}
            />
            {errors.name && (
              <span className="mt-1.5 block text-xs text-red-600">
                {errors.name}
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-800">
              Slug <span className="text-red-600">*</span>
            </span>
            <input
              value={slug}
              onChange={(event) => handleSlugChange(event.target.value)}
              className={inputClass(errors.slug)}
              dir="ltr"
              placeholder={kind === "category" ? "beverages" : "coca-cola"}
              disabled={isCreating}
            />
            {errors.slug ? (
              <span className="mt-1.5 block text-xs text-red-600">
                {errors.slug}
              </span>
            ) : (
              <span className="mt-1.5 block text-xs text-slate-500">
                استخدم أحرف إنجليزية صغيرة وأرقام وشرطات.
              </span>
            )}
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              disabled={isCreating}
            >
              إلغاء
            </Button>
            <Button type="submit" className="gap-2" disabled={isCreating}>
              {isCreating && <Loader2 className="size-4 animate-spin" />}
              {isCreating ? copy.loadingLabel : copy.submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function inputClass(error?: string) {
  return `h-10 w-full rounded-md border bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500 ${
    error
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-slate-200 focus:border-slate-400 focus:ring-slate-200"
  }`;
}

function apiErrorToFieldErrors(
  error: ApiErrorResponse,
  kind: QuickCreateKind,
): FieldErrors {
  const fieldErrors: FieldErrors = {};

  if (error.errors) {
    for (const [field, messages] of Object.entries(error.errors)) {
      const message = firstApiErrorMessage(messages);
      if (field === "name" || field === "slug") {
        fieldErrors[field] = translateCatalogMessage(message ?? "");
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return fieldErrors;
  }

  return {
    form: translateCatalogMessage(error.message, kind),
  };
}

function firstApiErrorMessage(value: unknown) {
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  if (typeof value === "string") return value;
  return null;
}

function translateCatalogMessage(message: string, kind?: QuickCreateKind) {
  const messages: Record<string, string> = {
    Required: "هذا الحقل مطلوب",
    "Must be 120 characters or fewer": "يجب ألا يتجاوز النص 120 حرفاً",
    "Must be 140 characters or fewer": "يجب ألا يتجاوز النص 140 حرفاً",
    "Slug must contain lowercase letters, numbers, and hyphens only":
      "استخدم أحرف إنجليزية صغيرة وأرقام وشرطات فقط",
    "Category slug already exists": "يوجد تصنيف بهذا المعرف مسبقاً",
    "Brand slug already exists": "توجد ماركة بهذا المعرف مسبقاً",
    "Unique constraint violation":
      kind === "brand"
        ? "توجد ماركة بهذا المعرف مسبقاً"
        : "يوجد تصنيف بهذا المعرف مسبقاً",
    "Internal server error": "حدث خطأ في الخادم",
  };

  return messages[message] ?? message;
}
