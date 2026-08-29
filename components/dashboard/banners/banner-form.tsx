"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { ZodError } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { ApiErrorResponse, ApiSuccess } from "@/lib/products/product-types";
import type { BannerDto } from "@/lib/banners/banner-types";
import {
  createBannerSchema,
  updateBannerSchema,
} from "@/lib/validations/banner";
import {
  BannerImageUploader,
  cleanupBannerImageKeys,
  createExistingBannerImage,
  emptyBannerImage,
  getBannerImageIssue,
  uploadPendingBannerImage,
  type BannerImageFormItem,
} from "@/components/dashboard/banners/banner-image-uploader";

type BannerFormMode = "create" | "edit";
type SaveStep = "idle" | "compressing" | "uploading" | "saving";

type BannerFormState = {
  title: string;
  description: string;
  buttonText: string;
  link: string;
  image: BannerImageFormItem;
  mobileImage: BannerImageFormItem;
  isActive: boolean;
  sortOrder: string;
  startsAt: string;
  endsAt: string;
};

type FieldErrors = Partial<Record<keyof BannerFormState | "form", string>>;

const defaultFormState: BannerFormState = {
  title: "",
  description: "",
  buttonText: "",
  link: "",
  image: emptyBannerImage,
  mobileImage: emptyBannerImage,
  isActive: true,
  sortOrder: "0",
  startsAt: "",
  endsAt: "",
};

export function BannerForm({
  mode,
  initialData,
}: {
  mode: BannerFormMode;
  initialData?: BannerDto;
}) {
  const router = useRouter();
  const [form, setForm] = useState<BannerFormState>(() =>
    initialData ? bannerToFormState(initialData) : defaultFormState,
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStep, setSaveStep] = useState<SaveStep>("idle");
  const [toast, setToast] = useState<string | null>(null);

  const submitLabel =
    saveStep === "compressing"
      ? "جاري تجهيز الصور..."
      : saveStep === "uploading"
        ? "جاري رفع الصور..."
        : saveStep === "saving"
          ? "جاري حفظ البنر..."
          : "حفظ البنر";

  const previewImage = form.mobileImage.previewUrl || form.mobileImage.url || form.image.previewUrl || form.image.url;
  const desktopPreviewImage = form.image.previewUrl || form.image.url;
  const previewLink = form.link || "/";
  const previewTitle = form.title || "عنوان البنر";
  const previewDescription = form.description || "وصف قصير للعروض الظاهرة في واجهة المتجر.";
  const previewButton = form.buttonText || "تسوق الآن";
  const isBlobPreview = previewImage.startsWith("blob:");
  const isDesktopBlobPreview = desktopPreviewImage.startsWith("blob:");

  const scheduleHint = useMemo(() => {
    if (!form.startsAt && !form.endsAt) return "يظهر البنر فوراً عند تفعيله.";
    if (form.startsAt && form.endsAt) return "يظهر البنر خلال الفترة المحددة فقط.";
    if (form.startsAt) return "يبدأ ظهور البنر من تاريخ البدء.";
    return "يتوقف ظهور البنر عند تاريخ الانتهاء.";
  }, [form.endsAt, form.startsAt]);

  function setField<K extends keyof BannerFormState>(
    key: K,
    value: BannerFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
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
      setSaveStep("compressing");

      const imageIssue = getBannerImageIssue(workingForm.image, true);
      const mobileImageIssue =
        workingForm.mobileImage.status === "empty"
          ? null
          : getBannerImageIssue(workingForm.mobileImage, false);

      if (imageIssue || mobileImageIssue) {
        setErrors({
          image: imageIssue ?? undefined,
          mobileImage: mobileImageIssue ?? undefined,
        });
        return;
      }

      setSaveStep("uploading");

      const desktopUpload = await uploadPendingBannerImage(
        workingForm.image,
        (image) => setField("image", image),
      );
      workingForm = { ...workingForm, image: desktopUpload.image };
      if (desktopUpload.uploadedKey) uploadedKeys.push(desktopUpload.uploadedKey);

      const mobileUpload = await uploadPendingBannerImage(
        workingForm.mobileImage,
        (image) => setField("mobileImage", image),
      );
      workingForm = { ...workingForm, mobileImage: mobileUpload.image };
      if (mobileUpload.uploadedKey) uploadedKeys.push(mobileUpload.uploadedKey);

      setSaveStep("saving");

      const schema = mode === "create" ? createBannerSchema : updateBannerSchema;
      const parsed = schema.safeParse(formToPayload(workingForm));

      if (!parsed.success) {
        await cleanupUploadedImagesForRetry(uploadedKeys);
        setErrors(zodToFieldErrors(parsed.error));
        return;
      }

      const response = await fetch(
        mode === "create" ? "/api/banners" : `/api/banners/${initialData?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(parsed.data),
        },
      );
      const json = (await response.json()) as ApiSuccess<BannerDto> | ApiErrorResponse;

      if (!json.success) {
        await cleanupUploadedImagesForRetry(uploadedKeys);
        setErrors(apiErrorsToFieldErrors(json));
        return;
      }

      setToast(mode === "create" ? "تمت إضافة البنر بنجاح" : "تم حفظ البنر بنجاح");
      window.setTimeout(() => router.push("/dashboard/banners"), 650);
    } catch (error) {
      if (uploadedKeys.length > 0) {
        await cleanupUploadedImagesForRetry(uploadedKeys);
      }

      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "تعذر حفظ البنر حالياً.",
      });
    } finally {
      setSaveStep("idle");
      setIsSaving(false);
    }
  }

  async function cleanupUploadedImagesForRetry(keys: string[]) {
    if (keys.length === 0) return;

    await cleanupBannerImageKeys(keys);
    setForm((current) => ({
      ...current,
      image: resetUploadedBannerImage(current.image, keys),
      mobileImage: resetUploadedBannerImage(current.mobileImage, keys),
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
              <Link href="/dashboard/banners" aria-label="العودة للبنرات">
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <div>
              <p className="text-xs text-slate-500">إدارة واجهة المتجر</p>
              <h1 className="text-2xl font-semibold tracking-tight">
                {mode === "create" ? "إضافة بنر" : "تعديل البنر"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/banners">إلغاء</Link>
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
            <BannerImageUploader
              label="صورة البنر"
              description="يفضل صورة عريضة بنسبة قريبة من 16:7. سيتم ضغط الصورة ورفعها عند الحفظ."
              value={form.image}
              required
              disabled={isSaving}
              onChange={(image) => setField("image", image)}
            />
            {errors.image && <FieldError message={errors.image} />}

            <BannerImageUploader
              label="صورة الموبايل"
              description="اختيارية. إذا لم تضفها سيستخدم المتجر صورة البنر الأساسية."
              value={form.mobileImage}
              disabled={isSaving}
              aspect="aspect-[4/3]"
              onChange={(image) => setField("mobileImage", image)}
            />
            {errors.mobileImage && <FieldError message={errors.mobileImage} />}

            <Card className="rounded-lg border-slate-200 shadow-none">
              <CardHeader>
                <CardTitle>محتوى البنر</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <TextField
                  label="العنوان"
                  value={form.title}
                  onChange={(title) => setField("title", title)}
                  error={errors.title}
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="نص الزر"
                    value={form.buttonText}
                    onChange={(buttonText) => setField("buttonText", buttonText)}
                    error={errors.buttonText}
                  />
                  <TextField
                    label="رابط الزر"
                    value={form.link}
                    onChange={(link) => setField("link", link)}
                    placeholder="/products أو ?category=drinks"
                    error={errors.link}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-slate-200 shadow-none">
              <CardHeader>
                <CardTitle>معاينة البنر</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-[14px] bg-[var(--store-primary-soft)] px-4 py-4">
                  <div className="grid min-h-[108px] grid-cols-[1fr_120px] items-center gap-3 overflow-hidden">
                    <div className="min-w-0">
                      <h2 className="text-[18px] font-bold leading-6 text-[var(--store-primary-strong)]">
                        {previewTitle}
                      </h2>
                      <p className="mt-1 max-w-[220px] text-[11px] leading-4 text-[var(--store-text-muted)]">
                        {previewDescription}
                      </p>
                      {previewButton && previewLink && (
                        <span className="mt-3 inline-flex h-8 items-center justify-center rounded-[8px] bg-[var(--store-primary)] px-3 text-xs font-bold text-white">
                          {previewButton}
                        </span>
                      )}
                    </div>
                    <div className="relative h-[104px] overflow-hidden rounded-lg">
                      {previewImage ? (
                        isBlobPreview ? (
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url("${previewImage}")` }}
                          />
                        ) : (
                          <Image
                            src={previewImage}
                            alt=""
                            fill
                            sizes="120px"
                            className="object-cover"
                          />
                        )
                      ) : (
                        <div className="absolute inset-0 bg-white/60" />
                      )}
                    </div>
                  </div>
                </div>
                {desktopPreviewImage && desktopPreviewImage !== previewImage && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <p className="mb-2 text-xs text-slate-500">معاينة صورة سطح المكتب</p>
                    <div className="relative aspect-[16/7] overflow-hidden rounded-md bg-white">
                      {isDesktopBlobPreview ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url("${desktopPreviewImage}")` }}
                        />
                      ) : (
                        <Image
                          src={desktopPreviewImage}
                          alt=""
                          fill
                          sizes="480px"
                          className="object-cover"
                        />
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-5">
            <Card className="rounded-lg border-slate-200 shadow-none">
              <CardHeader>
                <CardTitle>الحالة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-3">
                  <span>
                    <span className="block text-sm font-medium text-slate-800">
                      عرض البنر في المتجر
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      عند الإيقاف لن يظهر في الواجهة.
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
              </CardContent>
            </Card>

            <Card className="rounded-lg border-slate-200 shadow-none">
              <CardHeader>
                <CardTitle>الجدولة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TextField
                  label="تاريخ البدء"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(startsAt) => setField("startsAt", startsAt)}
                  error={errors.startsAt}
                />
                <TextField
                  label="تاريخ الانتهاء"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(endsAt) => setField("endsAt", endsAt)}
                  error={errors.endsAt}
                />
                <p className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
                  {scheduleHint}
                </p>
              </CardContent>
            </Card>
          </aside>
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
  type = "text",
  placeholder,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  min?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <input
        type={type}
        min={min}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-3 focus:ring-slate-200"
      />
      {error && <FieldError message={error} />}
    </label>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="text-xs text-red-600">{message}</p>;
}

function bannerToFormState(banner: BannerDto): BannerFormState {
  return {
    title: banner.title ?? "",
    description: banner.description ?? "",
    buttonText: banner.buttonText ?? "",
    link: banner.link ?? "",
    image: createExistingBannerImage(banner.image),
    mobileImage: banner.mobileImage
      ? createExistingBannerImage(banner.mobileImage)
      : emptyBannerImage,
    isActive: banner.isActive,
    sortOrder: banner.sortOrder.toString(),
    startsAt: toDatetimeLocalValue(banner.startsAt),
    endsAt: toDatetimeLocalValue(banner.endsAt),
  };
}

function formToPayload(form: BannerFormState) {
  return {
    title: form.title,
    description: form.description,
    image: form.image.url,
    mobileImage: form.mobileImage.url || null,
    buttonText: form.buttonText,
    link: form.link,
    position: "HERO",
    isActive: form.isActive,
    sortOrder: form.sortOrder,
    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
    endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
  };
}

function zodToFieldErrors(error: ZodError): FieldErrors {
  const errors: FieldErrors = {};

  error.issues.forEach((issue) => {
    const key = issue.path[0];
    if (typeof key === "string" && key in defaultFormState) {
      errors[key as keyof BannerFormState] = issue.message;
    } else {
      errors.form = issue.message;
    }
  });

  return errors;
}

function apiErrorsToFieldErrors(response: ApiErrorResponse): FieldErrors {
  const errors: FieldErrors = {};

  if (response.errors) {
    Object.entries(response.errors).forEach(([key, value]) => {
      if (key in defaultFormState) {
        errors[key as keyof BannerFormState] = Array.isArray(value)
          ? String(value[0])
          : String(value);
      }
    });
  }

  return Object.keys(errors).length > 0
    ? errors
    : { form: response.message || "تعذر حفظ البنر." };
}

function resetUploadedBannerImage(
  image: BannerImageFormItem,
  uploadedKeys: string[],
): BannerImageFormItem {
  if (!image.key || !uploadedKeys.includes(image.key)) return image;

  return {
    ...image,
    url: "",
    key: null,
    status: image.file ? "ready" : "empty",
  };
}

function toDatetimeLocalValue(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
