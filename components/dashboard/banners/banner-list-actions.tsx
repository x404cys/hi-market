"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { ApiErrorResponse, ApiSuccess } from "@/lib/products/product-types";
import type { BannerDto } from "@/lib/banners/banner-types";

export function BannerQuickActiveToggle({
  bannerId,
  isActive,
}: {
  bannerId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(isActive);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateActive(nextValue: boolean) {
    if (isSaving) return;

    const previousValue = checked;
    setChecked(nextValue);
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/banners/${bannerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: nextValue }),
      });
      const json = (await response.json()) as ApiSuccess<BannerDto> | ApiErrorResponse;

      if (!json.success) {
        throw new Error(json.message || "تعذر تحديث حالة البنر.");
      }

      router.refresh();
    } catch (toggleError) {
      setChecked(previousValue);
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "تعذر تحديث حالة البنر.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={checked}
        onCheckedChange={updateActive}
        disabled={isSaving}
        aria-label="عرض البنر في المتجر"
      />
      {isSaving && <Loader2 className="size-3.5 animate-spin text-slate-400" />}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

export function BannerRowActions({
  banner,
}: {
  banner: Pick<BannerDto, "id" | "link" | "title">;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteBanner() {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/banners/${banner.id}`, {
        method: "DELETE",
      });
      const json = (await response.json()) as ApiSuccess<BannerDto> | ApiErrorResponse;

      if (!json.success) {
        throw new Error(json.message || "تعذر حذف البنر.");
      }

      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "تعذر حذف البنر.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  async function copyLink() {
    if (!banner.link) return;
    await navigator.clipboard?.writeText(banner.link);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/dashboard/banners/${banner.id}/edit`}>
          <Pencil className="size-3.5" />
          تعديل
        </Link>
      </Button>
      {banner.link && (
        <Button type="button" variant="outline" size="sm" onClick={copyLink}>
          <Copy className="size-3.5" />
          نسخ الرابط
        </Button>
      )}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="destructive" size="sm">
            <Trash2 className="size-3.5" />
            حذف
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف البنر؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا البنر من لوحة التحكم والمتجر.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void deleteBanner();
              }}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
