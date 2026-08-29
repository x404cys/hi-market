"use client";

import Image from "next/image";
import { ImagePlus, Loader2, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApiErrorResponse, ApiSuccess } from "@/lib/products/product-types";
import {
  BANNER_IMAGE_MAX_DIMENSION,
  BANNER_IMAGE_WEBP_QUALITY,
  MAX_BANNER_IMAGE_ORIGINAL_SIZE_BYTES,
  MAX_BANNER_IMAGE_SIZE_BYTES,
  getOwnedBannerImageKeyFromUrl,
  productImageMimeTypes,
} from "@/lib/r2-utils";
import { useEffect, useRef, useState } from "react";

export type BannerImageFormItem = {
  url: string;
  key: string | null;
  previewUrl?: string;
  file?: File;
  originalFile?: File;
  fileName: string;
  status: "empty" | "existing" | "processing" | "ready" | "uploading" | "uploaded" | "error";
  error?: string;
};

type PresignData = {
  uploadUrl: string;
  key: string;
  publicUrl: string;
};

export const emptyBannerImage: BannerImageFormItem = {
  url: "",
  key: null,
  fileName: "",
  status: "empty",
};

export function createExistingBannerImage(url: string): BannerImageFormItem {
  return {
    url,
    key: getOwnedBannerImageKeyFromUrl(url),
    fileName: url.split("/").pop() ?? "banner-image",
    status: "existing",
  };
}

export function BannerImageUploader({
  label,
  description,
  value,
  required,
  disabled,
  aspect = "aspect-[16/7]",
  onChange,
}: {
  label: string;
  description: string;
  value: BannerImageFormItem;
  required?: boolean;
  disabled?: boolean;
  aspect?: string;
  onChange: (value: BannerImageFormItem) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [dropActive, setDropActive] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function addFile(file: File) {
    const validationError = validateOriginalBannerFile(file);

    if (validationError) {
      onChange({
        ...value,
        status: "error",
        error: validationError,
        originalFile: file,
      });
      return;
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);

    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    const nextImage: BannerImageFormItem = {
      url: "",
      key: null,
      previewUrl,
      originalFile: file,
      fileName: file.name,
      status: "processing",
    };

    onChange(nextImage);
    void prepareImage(nextImage, file);
  }

  async function prepareImage(currentImage: BannerImageFormItem, file: File) {
    try {
      const compressedFile = await compressBannerImage(file);

      if (compressedFile.size > MAX_BANNER_IMAGE_SIZE_BYTES) {
        throw new Error("حجم الصورة بعد التجهيز يتجاوز الحد المسموح.");
      }

      onChange({
        ...currentImage,
        file: compressedFile,
        fileName: compressedFile.name,
        status: "ready",
        error: undefined,
      });
    } catch (error) {
      onChange({
        ...currentImage,
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "تعذر تجهيز الصورة. جرّب صورة أخرى.",
      });
    }
  }

  function removeImage() {
    if (value.status === "uploading") return;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    onChange(emptyBannerImage);
  }

  function retryImage() {
    if (!value.originalFile) return;
    onChange({ ...value, status: "processing", error: undefined });
    void prepareImage(value, value.originalFile);
  }

  const displayUrl = value.previewUrl || value.url;
  const isBlobPreview = displayUrl.startsWith("blob:");

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">
              {label}
              {required && <span className="text-red-500"> *</span>}
            </h2>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          </div>
          {displayUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || value.status === "uploading"}
            >
              استبدال
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div
          onDragEnter={(event) => {
            event.preventDefault();
            setDropActive(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            setDropActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDropActive(false);
            const file = event.dataTransfer.files[0];
            if (!disabled && file) addFile(file);
          }}
          className={`${aspect} relative overflow-hidden rounded-lg border border-dashed ${
            dropActive ? "border-slate-500 bg-slate-100" : "border-slate-200 bg-slate-50"
          }`}
        >
          {displayUrl ? (
            isBlobPreview ? (
              <div
                className="absolute inset-0 bg-cover bg-center"
                role="img"
                aria-label={label}
                style={{ backgroundImage: `url("${displayUrl}")` }}
              />
            ) : (
              <Image
                src={displayUrl}
                alt={label}
                fill
                sizes="(min-width: 1024px) 640px, 100vw"
                className="object-cover"
              />
            )
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-slate-500 transition hover:bg-white/70 disabled:pointer-events-none disabled:opacity-50"
            >
              <UploadCloud className="size-8" />
              <span className="mt-3 text-sm font-semibold">اختر صورة</span>
              <span className="mt-1 text-xs">
                JPEG أو PNG أو WebP أو AVIF حتى 10MB
              </span>
            </button>
          )}

          {value.status !== "empty" && (
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-slate-950/75 px-3 py-2 text-xs text-white">
              <span>{bannerImageStatusLabel(value.status)}</span>
              {value.status === "processing" || value.status === "uploading" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={productImageMimeTypes.join(",")}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) addFile(file);
            event.target.value = "";
          }}
        />

        {value.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {value.error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {!displayUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              <ImagePlus className="size-4" />
              اختر من الجهاز
            </Button>
          )}
          {value.status === "error" && value.originalFile && (
            <Button type="button" variant="outline" size="sm" onClick={retryImage}>
              <RefreshCw className="size-4" />
              إعادة المحاولة
            </Button>
          )}
          {displayUrl && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={removeImage}
              disabled={disabled || value.status === "uploading"}
            >
              <Trash2 className="size-4" />
              إزالة
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

export function getBannerImageIssue(image: BannerImageFormItem, required = false) {
  if (required && !image.url && image.status !== "ready" && image.status !== "uploaded") {
    return "صورة البنر مطلوبة.";
  }

  if (image.status === "processing") return "جاري تجهيز الصورة. انتظر قبل الحفظ.";
  if (image.status === "uploading") return "جاري رفع الصورة. انتظر قبل الحفظ.";
  if (image.status === "error") return image.error ?? "توجد صورة غير جاهزة.";

  return null;
}

export async function uploadPendingBannerImage(
  image: BannerImageFormItem,
  onChange: (image: BannerImageFormItem) => void,
) {
  if (image.status === "empty" || image.status === "existing" || image.status === "uploaded") {
    return { image, uploadedKey: null };
  }

  if (image.status !== "ready" || !image.file) {
    const nextImage = {
      ...image,
      status: "error" as const,
      error: "الصورة غير جاهزة للحفظ.",
    };
    onChange(nextImage);
    throw new Error("الصورة غير جاهزة للحفظ.");
  }

  const uploadingImage = { ...image, status: "uploading" as const, error: undefined };
  onChange(uploadingImage);

  try {
    const presign = await requestBannerImagePresign(image.file);
    const uploadResponse = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": image.file.type,
      },
      body: image.file,
    });

    if (!uploadResponse.ok) {
      throw new Error("فشل رفع صورة البنر.");
    }

    const uploadedImage = {
      ...image,
      url: presign.publicUrl,
      key: presign.key,
      status: "uploaded" as const,
      error: undefined,
    };
    onChange(uploadedImage);

    return { image: uploadedImage, uploadedKey: presign.key };
  } catch (error) {
    const errorImage = {
      ...image,
      status: "error" as const,
      error: error instanceof Error ? error.message : "فشل رفع صورة البنر.",
    };
    onChange(errorImage);
    throw error;
  }
}

export async function cleanupBannerImageKeys(keys: string[]) {
  const uniqueKeys = Array.from(new Set(keys));

  await Promise.allSettled(
    uniqueKeys.map(async (key) => {
      const response = await fetch("/api/uploads/banners", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key }),
      });

      if (!response.ok) {
        return;
      }
    }),
  );
}

function validateOriginalBannerFile(file: File) {
  if (!productImageMimeTypes.includes(file.type as (typeof productImageMimeTypes)[number])) {
    return "نوع الصورة غير مدعوم.";
  }

  if (file.size > MAX_BANNER_IMAGE_ORIGINAL_SIZE_BYTES) {
    return "حجم الصورة الأصلي يتجاوز الحد المسموح.";
  }

  return null;
}

async function requestBannerImagePresign(file: File) {
  const response = await fetch("/api/uploads/banners/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    }),
  });
  const json = (await response.json()) as ApiSuccess<PresignData> | ApiErrorResponse;

  if (!json.success) {
    throw new Error(translateUploadApiMessage(json.message));
  }

  return json.data;
}

async function compressBannerImage(file: File) {
  const bitmap = await loadImageBitmap(file);
  const { width, height } = getContainedSize(
    bitmap.width,
    bitmap.height,
    BANNER_IMAGE_MAX_DIMENSION,
  );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close?.();
    throw new Error("تعذر تجهيز الصورة. جرّب صورة أخرى.");
  }

  context.clearRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", BANNER_IMAGE_WEBP_QUALITY);
  });

  if (!blob) {
    throw new Error("تعذر تجهيز الصورة. جرّب صورة أخرى.");
  }

  const basename = file.name.replace(/\.[^.]+$/, "") || "banner-image";

  return new File([blob], `${basename}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file);
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("تعذر تجهيز الصورة. جرّب صورة أخرى."));
      element.src = imageUrl;
    });

    return createImageBitmap(image);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function getContainedSize(width: number, height: number, maxDimension: number) {
  const scale = Math.min(1, maxDimension / Math.max(width, height));

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function bannerImageStatusLabel(status: BannerImageFormItem["status"]) {
  const labels: Record<BannerImageFormItem["status"], string> = {
    empty: "لم يتم اختيار صورة",
    existing: "محفوظة",
    processing: "جاري التجهيز",
    ready: "جاهزة للحفظ",
    uploading: "جاري الرفع",
    uploaded: "تم الرفع",
    error: "تحتاج مراجعة",
  };

  return labels[status];
}

function translateUploadApiMessage(message: string) {
  const messages: Record<string, string> = {
    "Invalid image type": "نوع الصورة غير مدعوم.",
    "Image exceeds the maximum allowed size": "حجم الصورة يتجاوز الحد المسموح.",
    "Image upload service is unavailable": "خدمة رفع الصور غير متاحة حالياً.",
    "Invalid image metadata": "بيانات الصورة غير صالحة.",
  };

  return messages[message] ?? "فشل تجهيز رفع الصورة.";
}
