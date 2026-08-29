"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { ZodError } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { createSlug } from "@/lib/products/product-format";
import type { ApiErrorResponse, ApiSuccess } from "@/lib/products/product-types";
import type { CategoryDto } from "@/lib/categories/category-types";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/validations/category";
import {
  CategoryImageUploader,
  cleanupCategoryImageKeys,
  createExistingCategoryImage,
  emptyCategoryImage,
  getCategoryImageIssue,
  uploadPendingCategoryImage,
  type CategoryImageFormItem,
} from "@/components/dashboard/categories/category-image-uploader";

type CategoryFormMode = "create" | "edit";
type SaveStep = "idle" | "uploading" | "saving";

type CategoryFormState = {
  name: string;
  slug: string;
  description: string;
  image: CategoryImageFormItem;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
};

type FieldErrors = Partial<Record<keyof CategoryFormState | "form", string>>;

const defaultFormState: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  image: emptyCategoryImage,
  parentId: "",
  sortOrder: "0",
  isActive: true,
};

export function CategoryForm({
  mode,
  initialData,
  parentCategories,
}: {
  mode: CategoryFormMode;
  initialData?: CategoryDto;
  parentCategories: CategoryDto[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<CategoryFormState>(() =>
    initialData ? categoryToFormState(initialData) : defaultFormState,
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStep, setSaveStep] = useState<SaveStep>("idle");
  const [toast, setToast] = useState<string | null>(null);
  const [isSlugDirty, setIsSlugDirty] = useState(Boolean(initialData?.slug));

  const parentOptions = useMemo(
    () => parentCategories.filter((category) => category.id !== initialData?.id),
    [initialData?.id, parentCategories],
  );
  const submitLabel =
    saveStep === "uploading"
      ? "جاري رفع الصورة..."
      : saveStep === "saving"
        ? "جاري حفظ الصنف..."
        : "حفظ الصنف";

  function setField<K extends keyof CategoryFormState>(
    key: K,
    value: CategoryFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  function handleNameChange(value: string) {
    setField("name", value);

    if (!isSlugDirty) {
      setForm((current) => ({
        ...current,
        slug: createCategorySlug(value, current.slug),
      }));
      setErrors((current) => ({ ...current, slug: undefined }));
    }
  }

  function handleSlugChange(value: string) {
    setIsSlugDirty(true);
    setField("slug", createSlug(value));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setErrors({});
    setToast(null);
    const uploadedKeys: string[] = [];
    let workingForm = form;

    try {
      const imageIssue = getCategoryImageIssue(workingForm.image);
      if (imageIssue) {
        setErrors({ image: imageIssue });
        return;
      }

      const schema = mode === "create" ? createCategorySchema : updateCategorySchema;
      const preUploadParsed = schema.safeParse(formToPayload(workingForm));
      if (!preUploadParsed.success) {
        setErrors(zodToFieldErrors(preUploadParsed.error));
        return;
      }

      setSaveStep("uploading");
      const imageUpload = await uploadPendingCategoryImage(
        workingForm.image,
        (image) => setField("image", image),
      );
      workingForm = { ...workingForm, image: imageUpload.image };
      if (imageUpload.uploadedKey) uploadedKeys.push(imageUpload.uploadedKey);

      setSaveStep("saving");
      const parsed = schema.safeParse(formToPayload(workingForm));
      if (!parsed.success) {
        await cleanupUploadedImagesForRetry(uploadedKeys, workingForm.image);
        setErrors(zodToFieldErrors(parsed.error));
        return;
      }

      const response = await fetch(
        mode === "create" ? "/api/categories" : `/api/categories/${initialData?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(parsed.data),
        },
      );
      const json = (await response.json()) as ApiSuccess<CategoryDto> | ApiErrorResponse;

      if (!json.success) {
        await cleanupUploadedImagesForRetry(uploadedKeys, workingForm.image);
        setErrors(apiErrorsToFieldErrors(json));
        return;
      }

      setToast(mode === "create" ? "تمت إضافة الصنف بنجاح" : "تم حفظ الصنف بنجاح");
      window.setTimeout(() => router.push("/dashboard/categories"), 650);
    } catch (error) {
      if (uploadedKeys.length > 0) {
        await cleanupUploadedImagesForRetry(uploadedKeys, workingForm.image);
      }

      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "تعذر حفظ الصنف حالياً.",
      });
    } finally {
      setSaveStep("idle");
      setIsSaving(false);
    }
  }

  async function cleanupUploadedImagesForRetry(
    keys: string[],
    image: CategoryImageFormItem,
  ) {
    if (keys.length === 0) return;

    await cleanupCategoryImageKeys(keys);
    setForm((current) => ({
      ...current,
      image: resetUploadedCategoryImage(image, keys),
    }));
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f8fafc] text-slate-950">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 pb-28 sm:px-6 lg:px-8 lg:pb-8"
      >
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="icon" className="rounded-md">
              <Link href="/dashboard/categories" aria-label="العودة للأصناف">
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <div>
              <p className="text-xs text-slate-500">إدارة الأصناف</p>
              <h1 className="text-2xl font-semibold tracking-tight">
                {mode === "create" ? "إضافة صنف" : "تعديل الصنف"}
              </h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Button asChild variant="outline">
              <Link href="/dashboard/categories">إلغاء</Link>
            </Button>
            <Button type="submit" disabled={isSaving} className="gap-2 bg-slate-950 text-white hover:bg-slate-900">
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {submitLabel}
            </Button>
          </div>
        </header>

        {toast && (
          <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {toast}
          </p>
        )}
        {errors.form && (
          <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errors.form}
          </p>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <Card className="rounded-lg border-slate-200 shadow-none">
              <CardHeader>
                <CardTitle>بيانات الصنف</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <TextField
                  label="اسم الصنف"
                  required
                  value={form.name}
                  onChange={handleNameChange}
                  error={errors.name}
                  placeholder="مشروبات"
                />
                <TextField
                  label="Slug"
                  required
                  value={form.slug}
                  onChange={handleSlugChange}
                  error={errors.slug}
                  placeholder="beverages"
                  dir="ltr"
                  help="استخدم أحرف إنجليزية صغيرة وأرقام وشرطات."
                />
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-slate-800">الوصف</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => setField("description", event.target.value)}
                    rows={4}
                    className="min-h-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-3 focus:ring-slate-200"
                  />
                  {errors.description && <FieldError message={errors.description} />}
                </label>
              </CardContent>
            </Card>

            <CategoryImageUploader
              value={form.image}
              disabled={isSaving}
              onChange={(image) => setField("image", image)}
            />
            {errors.image && <FieldError message={errors.image} />}
          </div>

          <aside className="space-y-5">
            <Card className="rounded-lg border-slate-200 shadow-none">
              <CardHeader>
                <CardTitle>الظهور والتنظيم</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-3">
                  <span>
                    <span className="block text-sm font-medium text-slate-800">
                      عرض الصنف في المتجر
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      الأصناف غير النشطة لا تظهر في الواجهة.
                    </span>
                  </span>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(isActive) => setField("isActive", isActive)}
                    disabled={isSaving}
                  />
                </label>

                <TextField
                  label="الترتيب"
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(sortOrder) => setField("sortOrder", sortOrder)}
                  error={errors.sortOrder}
                />

                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-slate-800">التصنيف الأب</span>
                  <select
                    value={form.parentId}
                    onChange={(event) => setField("parentId", event.target.value)}
                    disabled={isSaving || parentOptions.length === 0}
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-3 focus:ring-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    <option value="">بدون صنف أب</option>
                    {parentOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.parentId && <FieldError message={errors.parentId} />}
                </label>
              </CardContent>
            </Card>
          </aside>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-7xl justify-end gap-2">
            <Button type="button" variant="outline" asChild className="flex-1">
              <Link href="/dashboard/categories">إلغاء</Link>
            </Button>
            <Button type="submit" disabled={isSaving} className="flex-1 gap-2">
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}

function TextField({
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
  placeholder,
  min,
  dir,
  help,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  min?: string;
  dir?: "ltr" | "rtl";
  help?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-slate-800">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        type={type}
        min={min}
        value={value}
        placeholder={placeholder}
        dir={dir}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-3 focus:ring-slate-200"
      />
      {error ? <FieldError message={error} /> : help ? (
        <span className="text-xs text-slate-500">{help}</span>
      ) : null}
    </label>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="text-xs text-red-600">{message}</p>;
}

function categoryToFormState(category: CategoryDto): CategoryFormState {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    image: category.image ? createExistingCategoryImage(category.image) : emptyCategoryImage,
    parentId: category.parentId ?? "",
    sortOrder: category.sortOrder.toString(),
    isActive: category.isActive,
  };
}

function formToPayload(form: CategoryFormState) {
  return {
    name: form.name,
    slug: form.slug,
    description: nullableString(form.description),
    image: form.image.url || null,
    parentId: form.parentId || null,
    sortOrder: form.sortOrder,
    isActive: form.isActive,
  };
}

function zodToFieldErrors(error: ZodError): FieldErrors {
  const errors: FieldErrors = {};

  error.issues.forEach((issue) => {
    const key = issue.path[0];
    if (typeof key === "string" && key in defaultFormState) {
      errors[key as keyof CategoryFormState] = translateCategoryMessage(issue.message);
    } else {
      errors.form = translateCategoryMessage(issue.message);
    }
  });

  return errors;
}

function apiErrorsToFieldErrors(response: ApiErrorResponse): FieldErrors {
  const errors: FieldErrors = {};

  if (response.errors) {
    Object.entries(response.errors).forEach(([key, value]) => {
      if (key in defaultFormState || key === "category") {
        const target = key === "category" ? "form" : (key as keyof CategoryFormState);
        errors[target] = translateCategoryMessage(
          Array.isArray(value) ? String(value[0]) : String(value),
        );
      }
    });
  }

  return Object.keys(errors).length > 0
    ? errors
    : { form: translateCategoryMessage(response.message || "تعذر حفظ الصنف.") };
}

function resetUploadedCategoryImage(
  image: CategoryImageFormItem,
  uploadedKeys: string[],
): CategoryImageFormItem {
  if (!image.key || !uploadedKeys.includes(image.key)) return image;

  return {
    ...image,
    url: "",
    key: null,
    status: image.file ? "ready" : "empty",
  };
}

function nullableString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function createCategorySlug(value: string, currentSlug: string) {
  const slug = createSlug(value);
  if (slug) return slug;
  if (currentSlug) return currentSlug;
  if (!value.trim()) return "";

  return `category-${crypto.randomUUID().slice(0, 8)}`;
}

function translateCategoryMessage(message: string) {
  const messages: Record<string, string> = {
    Required: "هذا الحقل مطلوب",
    "Invalid id": "القيمة المحددة غير صالحة",
    "Must be 120 characters or fewer": "يجب ألا يتجاوز النص 120 حرفاً",
    "Must be 140 characters or fewer": "يجب ألا يتجاوز النص 140 حرفاً",
    "Slug must contain lowercase letters, numbers, and hyphens only":
      "استخدم أحرف إنجليزية صغيرة وأرقام وشرطات فقط",
    "Category slug already exists": "يوجد صنف بهذا الرابط مسبقاً",
    "Category not found": "الصنف غير موجود",
    "Parent category not found": "الصنف الأب غير موجود",
    "Category cannot be its own parent": "لا يمكن جعل الصنف أباً لنفسه",
    "Category parent cannot be a descendant": "لا يمكن اختيار صنف فرعي كصنف أب",
    "Category has products": "لا يمكن حذف هذا الصنف لأنه يحتوي على منتجات.",
    "Internal server error": "حدث خطأ في الخادم",
  };

  return messages[message] ?? message;
}
