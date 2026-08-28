"use client";

import { Button } from "@/components/ui/button";
import type { ApiErrorResponse, ApiSuccess } from "@/lib/products/product-types";
import {
  MAX_PRODUCT_IMAGE_ORIGINAL_SIZE_BYTES,
  MAX_PRODUCT_IMAGE_SIZE_BYTES,
  PRODUCT_IMAGE_MAX_DIMENSION,
  PRODUCT_IMAGE_WEBP_QUALITY,
  getOwnedR2ObjectKeyFromUrl,
  productImageMimeTypes,
} from "@/lib/r2-utils";
import {
  Check,
  ImagePlus,
  Loader2,
  Package,
  RefreshCw,
  Star,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type ProductImageFormItem = {
  id: string;
  url: string;
  key: string | null;
  previewUrl?: string;
  file?: File;
  originalFile?: File;
  fileName: string;
  source: "existing" | "new";
  status: "existing" | "processing" | "ready" | "uploading" | "uploaded" | "error";
  isPrimary: boolean;
  error?: string;
};

type ProductImagesChange = (
  updater: (images: ProductImageFormItem[]) => ProductImageFormItem[],
) => void;

type PresignData = {
  uploadUrl: string;
  key: string;
  publicUrl: string;
};

export type ProductImageSaveStep = "idle" | "compressing" | "uploading" | "saving";

const maxImages = 50;

export function ProductImagesSection({
  images,
  error,
  disabled,
  onImagesChange,
}: {
  images: ProductImageFormItem[];
  error?: string;
  disabled?: boolean;
  onImagesChange: ProductImagesChange;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const createdPreviewUrlsRef = useRef<Set<string>>(new Set());
  const [dropActive, setDropActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const previewUrls = createdPreviewUrlsRef.current;

    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.clear();
    };
  }, []);

  const primaryImage = images.find((image) => image.isPrimary);

  function addFiles(files: FileList | File[]) {
    setLocalError(null);
    const selectedFiles = Array.from(files);
    const availableSlots = maxImages - images.length;

    if (availableSlots <= 0) {
      setLocalError("وصلت إلى الحد الأقصى لعدد الصور.");
      return;
    }

    selectedFiles.slice(0, availableSlots).forEach((file) => {
      const validationError = validateOriginalFile(file);
      if (validationError) {
        setLocalError(validationError);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      createdPreviewUrlsRef.current.add(previewUrl);
      const item: ProductImageFormItem = {
        id: crypto.randomUUID(),
        url: "",
        key: null,
        previewUrl,
        originalFile: file,
        fileName: file.name,
        source: "new",
        status: "processing",
        isPrimary: false,
      };

      onImagesChange((current) => ensureProductImagePrimary([...current, item]));
      void prepareImage(item.id, file);
    });

    if (selectedFiles.length > availableSlots) {
      setLocalError("تم تجاهل بعض الصور بسبب الحد الأقصى.");
    }
  }

  async function prepareImage(itemId: string, file: File) {
    updateImage(itemId, {
      status: "processing",
      error: undefined,
    });

    try {
      const compressedFile = await compressProductImage(file);

      if (compressedFile.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
        throw new Error("حجم الصورة بعد التجهيز يتجاوز الحد المسموح.");
      }

      updateImage(itemId, {
        file: compressedFile,
        fileName: compressedFile.name,
        status: "ready",
        error: undefined,
      });
    } catch (prepareError) {
      updateImage(itemId, {
        status: "error",
        error:
          prepareError instanceof Error
            ? prepareError.message
            : "تعذر تجهيز الصورة. جرّب صورة أخرى.",
      });
    }
  }

  function updateImage(id: string, patch: Partial<ProductImageFormItem>) {
    onImagesChange((current) =>
      ensureProductImagePrimary(
        current.map((image) =>
          image.id === id
            ? {
                ...image,
                ...patch,
              }
            : image,
        ),
      ),
    );
  }

  function removeImage(image: ProductImageFormItem) {
    if (image.status === "uploading") return;

    if (image.previewUrl && createdPreviewUrlsRef.current.has(image.previewUrl)) {
      URL.revokeObjectURL(image.previewUrl);
      createdPreviewUrlsRef.current.delete(image.previewUrl);
    }

    onImagesChange((current) =>
      ensureProductImagePrimary(current.filter((item) => item.id !== image.id)),
    );
  }

  function setPrimaryImage(id: string) {
    onImagesChange((current) =>
      current.map((image) => ({
        ...image,
        isPrimary: image.id === id,
      })),
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-950">صور المنتج</h2>
        <p className="mt-1 text-sm text-slate-500">
          اختر الصور الآن، وسيتم رفعها إلى R2 عند حفظ المنتج.
        </p>
      </div>

      <div className="grid gap-4 p-4">
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
            if (!disabled) addFiles(event.dataTransfer.files);
          }}
          className={`flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center transition ${
            dropActive
              ? "border-slate-500 bg-slate-100"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <UploadCloud className="size-8 text-slate-400" />
          <p className="mt-3 text-sm font-medium text-slate-800">اسحب الصور هنا</p>
          <p className="mt-1 text-xs text-slate-500">
            JPEG أو PNG أو WebP أو AVIF حتى 10MB، وسيتم ضغطها إلى WebP
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 gap-2"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="size-4" />
            اختر من الجهاز
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={productImageMimeTypes.join(",")}
            multiple
            className="hidden"
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </div>

        {(error || localError) && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {error || localError}
          </p>
        )}

        <div className="grid gap-3 md:grid-cols-[220px_1fr]">
          <ImageTile image={primaryImage ?? null} label="الصورة الرئيسية" large />

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((image, index) => (
              <ImageTile
                key={image.id}
                image={image}
                label={`صورة ${index + 1}`}
                onRemove={disabled ? undefined : () => removeImage(image)}
                onRetry={
                  !disabled && image.status === "error" && image.originalFile
                    ? () => void prepareImage(image.id, image.originalFile as File)
                    : undefined
                }
                onPrimary={
                  !disabled && image.status !== "processing" && image.status !== "error"
                    ? () => setPrimaryImage(image.id)
                    : undefined
                }
              />
            ))}
            <button
              type="button"
              disabled={disabled || images.length >= maxImages}
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-400 transition hover:border-slate-300 hover:bg-white disabled:pointer-events-none disabled:opacity-50"
              aria-label="إضافة صورة"
            >
              <ImagePlus className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ImageTile({
  image,
  label,
  large,
  onRemove,
  onRetry,
  onPrimary,
}: {
  image: ProductImageFormItem | null;
  label: string;
  large?: boolean;
  onRemove?: () => void;
  onRetry?: () => void;
  onPrimary?: () => void;
}) {
  const displayUrl = image?.previewUrl || image?.url || "";
  const isBlobPreview = displayUrl.startsWith("blob:");
  const removeDisabled = image?.status === "uploading";

  return (
    <div
      className={`group relative overflow-hidden rounded-md border border-slate-200 bg-slate-50 ${
        large ? "aspect-[4/3]" : "aspect-square"
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
            sizes={large ? "220px" : "140px"}
            className="object-cover"
          />
        )
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Package className="size-6" />
          <span className="text-xs">{label}</span>
        </div>
      )}

      {image && (
        <>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-slate-950/70 px-2 py-1 text-[11px] text-white">
            <span className="truncate">{statusLabel(image.status)}</span>
            {statusIcon(image.status)}
          </div>

          <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
            {onPrimary && !image.isPrimary && (
              <button
                type="button"
                onClick={onPrimary}
                className="flex size-7 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm"
                aria-label="تعيين كصورة رئيسية"
              >
                <Star className="size-3.5" />
              </button>
            )}
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex size-7 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm"
                aria-label="إعادة تجهيز الصورة"
              >
                <RefreshCw className="size-3.5" />
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                disabled={removeDisabled}
                className="flex size-7 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-sm disabled:opacity-50"
                aria-label="إزالة الصورة"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>

          {image.isPrimary && (
            <span className="absolute left-1 top-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-800 shadow-sm">
              الرئيسية
            </span>
          )}

          {image.error && (
            <div className="absolute inset-x-1 top-9 rounded-md bg-red-600 px-2 py-1 text-[11px] leading-4 text-white">
              {image.error}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function createExistingProductImageItem(
  url: string,
  options?: { id?: string; isPrimary?: boolean; fileName?: string },
): ProductImageFormItem {
  return {
    id: options?.id ?? crypto.randomUUID(),
    url,
    key: getOwnedR2ObjectKeyFromUrl(url),
    fileName: options?.fileName ?? url.split("/").pop() ?? "product-image",
    source: "existing",
    status: "existing",
    isPrimary: options?.isPrimary ?? false,
  };
}

export function ensureProductImagePrimary(images: ProductImageFormItem[]) {
  const usableImages = images.filter((image) => canBePrimary(image));
  const currentPrimary = usableImages.find((image) => image.isPrimary);
  const primaryId = currentPrimary?.id ?? usableImages[0]?.id ?? null;

  return images.map((image) => ({
    ...image,
    isPrimary: primaryId ? image.id === primaryId : false,
  }));
}

export function getProductImageUploadIssue(images: ProductImageFormItem[]) {
  if (images.some((image) => image.status === "processing")) {
    return "جاري تجهيز الصور. انتظر اكتمال التجهيز قبل حفظ المنتج.";
  }

  if (images.some((image) => image.status === "uploading")) {
    return "جاري رفع الصور. انتظر اكتمال الرفع قبل حفظ المنتج.";
  }

  if (images.some((image) => image.status === "error")) {
    return "توجد صورة غير جاهزة. أعد تجهيزها أو احذفها قبل الحفظ.";
  }

  return null;
}

export function getNewUploadedProductImageKeys(images: ProductImageFormItem[]) {
  return images
    .filter((image) => image.source === "new" && image.status === "uploaded" && image.key)
    .map((image) => image.key as string);
}

export function getRemovedExistingProductImageKeys(
  initialImages: ProductImageFormItem[],
  currentImages: ProductImageFormItem[],
) {
  const currentKeys = new Set(
    currentImages
      .filter((image) => image.source === "existing" && image.key)
      .map((image) => image.key as string),
  );

  return initialImages
    .filter((image) => image.source === "existing" && image.key && !currentKeys.has(image.key))
    .map((image) => image.key as string);
}

export function removeProductImagesByKeys(
  images: ProductImageFormItem[],
  keys: string[],
) {
  const keySet = new Set(keys);

  return ensureProductImagePrimary(
    images.filter((image) => !image.key || !keySet.has(image.key)),
  );
}

export function resetUploadedProductImagesByKeys(
  images: ProductImageFormItem[],
  keys: string[],
) {
  const keySet = new Set(keys);

  return ensureProductImagePrimary(
    images.map((image) =>
      image.key && keySet.has(image.key)
        ? {
            ...image,
            url: "",
            key: null,
            status: "ready" as const,
            error: undefined,
          }
        : image,
    ),
  );
}

export async function preparePendingProductImages(
  images: ProductImageFormItem[],
) {
  const preparedImages = await Promise.all(
    images.map(async (image) => {
      if (image.source !== "new" || image.status !== "processing") {
        return image;
      }

      if (!image.originalFile) {
        return {
          ...image,
          status: "error" as const,
          error: "تعذر تجهيز الصورة. جرّب صورة أخرى.",
        };
      }

      try {
        const file = await compressProductImage(image.originalFile);

        if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
          throw new Error("حجم الصورة بعد التجهيز يتجاوز الحد المسموح.");
        }

        return {
          ...image,
          file,
          fileName: file.name,
          status: "ready" as const,
          error: undefined,
        };
      } catch (error) {
        return {
          ...image,
          status: "error" as const,
          error:
            error instanceof Error
              ? error.message
              : "تعذر تجهيز الصورة. جرّب صورة أخرى.",
        };
      }
    }),
  );

  return ensureProductImagePrimary(preparedImages);
}

export async function uploadPendingProductImages(
  images: ProductImageFormItem[],
  onImagesChange: ProductImagesChange,
) {
  const uploadedKeys: string[] = [];
  let nextImages = ensureProductImagePrimary(images);

  for (const image of nextImages) {
    if (image.source !== "new" || image.status === "uploaded") continue;

    if (image.status !== "ready" || !image.file) {
      nextImages = patchProductImage(nextImages, image.id, {
        status: "error",
        error: "الصورة غير جاهزة للحفظ.",
      });
      onImagesChange(() => nextImages);
      throw new Error("توجد صورة غير جاهزة للحفظ.");
    }

    nextImages = patchProductImage(nextImages, image.id, {
      status: "uploading",
      error: undefined,
    });
    onImagesChange(() => nextImages);

    try {
      const presign = await requestProductImagePresign(image.file);
      const uploadResponse = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": image.file.type,
        },
        body: image.file,
      });

      if (!uploadResponse.ok) {
        throw new Error("فشل رفع إحدى الصور.");
      }

      uploadedKeys.push(presign.key);
      nextImages = patchProductImage(nextImages, image.id, {
        url: presign.publicUrl,
        key: presign.key,
        status: "uploaded",
        error: undefined,
      });
      onImagesChange(() => ensureProductImagePrimary(nextImages));
    } catch (error) {
      nextImages = patchProductImage(nextImages, image.id, {
        status: "error",
        error: error instanceof Error ? error.message : "فشل رفع إحدى الصور.",
      });
      onImagesChange(() => ensureProductImagePrimary(nextImages));

      if (uploadedKeys.length > 0) {
        await cleanupProductImageKeys(uploadedKeys);
        nextImages = resetUploadedProductImagesByKeys(nextImages, uploadedKeys);
        onImagesChange(() => nextImages);
      }

      throw error;
    }
  }

  return {
    images: ensureProductImagePrimary(nextImages),
    uploadedKeys,
  };
}

export async function cleanupProductImageKeys(keys: string[]) {
  const uniqueKeys = Array.from(new Set(keys));

  await Promise.allSettled(
    uniqueKeys.map(async (key) => {
      const response = await fetch("/api/uploads/products", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key }),
      });

      if (!response.ok) {
        console.error("Product image cleanup failed", { key });
      }
    }),
  );
}

function validateOriginalFile(file: File) {
  if (!productImageMimeTypes.includes(file.type as (typeof productImageMimeTypes)[number])) {
    return "نوع الصورة غير مدعوم.";
  }

  if (file.size > MAX_PRODUCT_IMAGE_ORIGINAL_SIZE_BYTES) {
    return "حجم الصورة الأصلي يتجاوز الحد المسموح.";
  }

  return null;
}

async function requestProductImagePresign(file: File) {
  const response = await fetch("/api/uploads/products/presign", {
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

async function compressProductImage(file: File) {
  const bitmap = await loadImageBitmap(file);
  const { width, height } = getContainedSize(
    bitmap.width,
    bitmap.height,
    PRODUCT_IMAGE_MAX_DIMENSION,
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
    canvas.toBlob(resolve, "image/webp", PRODUCT_IMAGE_WEBP_QUALITY);
  });

  if (!blob) {
    throw new Error("تعذر تجهيز الصورة. جرّب صورة أخرى.");
  }

  const basename = file.name.replace(/\.[^.]+$/, "") || "product-image";

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

function patchProductImage(
  images: ProductImageFormItem[],
  id: string,
  patch: Partial<ProductImageFormItem>,
) {
  return ensureProductImagePrimary(
    images.map((image) =>
      image.id === id
        ? {
            ...image,
            ...patch,
          }
        : image,
    ),
  );
}

function canBePrimary(image: ProductImageFormItem) {
  if (image.source === "existing") return Boolean(image.url);

  return (
    image.status === "ready" ||
    image.status === "uploading" ||
    image.status === "uploaded"
  );
}

function statusLabel(status: ProductImageFormItem["status"]) {
  const labels: Record<ProductImageFormItem["status"], string> = {
    existing: "محفوظة",
    processing: "جاري التجهيز",
    ready: "جاهزة للحفظ",
    uploading: "جاري الرفع",
    uploaded: "تم الرفع",
    error: "تحتاج مراجعة",
  };

  return labels[status];
}

function statusIcon(status: ProductImageFormItem["status"]) {
  if (status === "processing" || status === "uploading") {
    return <Loader2 className="size-3 animate-spin" />;
  }

  if (status === "ready" || status === "uploaded" || status === "existing") {
    return <Check className="size-3" />;
  }

  return <XCircle className="size-3" />;
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
