"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";
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
import type { CategoryDto } from "@/lib/categories/category-types";
import type { ApiErrorResponse, ApiSuccess } from "@/lib/products/product-types";

export function CategoryQuickActiveToggle({
  categoryId,
  isActive,
}: {
  categoryId: string;
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
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: nextValue }),
      });
      const json = (await response.json()) as ApiSuccess<CategoryDto> | ApiErrorResponse;

      if (!json.success) {
        throw new Error(translateCategoryActionMessage(json.message));
      }

      router.refresh();
    } catch (toggleError) {
      setChecked(previousValue);
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "تعذر تحديث حالة الصنف.",
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
        aria-label="عرض الصنف في المتجر"
      />
      {isSaving && <Loader2 className="size-3.5 animate-spin text-slate-400" />}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

export function CategoryRowActions({
  category,
}: {
  category: Pick<CategoryDto, "id" | "name" | "productCount">;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteCategory() {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });
      const json = (await response.json()) as ApiSuccess<CategoryDto> | ApiErrorResponse;

      if (!json.success) {
        throw new Error(getDeleteErrorMessage(json));
      }

      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "تعذر حذف الصنف.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/dashboard/categories/${category.id}/edit`}>
          <Pencil className="size-3.5" />
          تعديل
        </Link>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="destructive" size="sm">
            <Trash2 className="size-3.5" />
            حذف
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الصنف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الصنف من لوحة التحكم والمتجر. لا يمكن حذف صنف يحتوي على منتجات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {category.productCount > 0 && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
              يحتوي هذا الصنف على منتجات، ولن يتم حذفه قبل نقل المنتجات إلى صنف آخر.
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void deleteCategory();
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

function getDeleteErrorMessage(response: ApiErrorResponse) {
  const categoryMessages = response.errors?.category;
  if (Array.isArray(categoryMessages) && typeof categoryMessages[0] === "string") {
    return categoryMessages[0];
  }

  return translateCategoryActionMessage(response.message);
}

function translateCategoryActionMessage(message: string) {
  const messages: Record<string, string> = {
    "Category not found": "الصنف غير موجود",
    "Category has products": "لا يمكن حذف هذا الصنف لأنه يحتوي على منتجات.",
    "Unique constraint violation": "يوجد صنف بنفس البيانات مسبقاً",
    "Internal server error": "حدث خطأ في الخادم",
  };

  return messages[message] ?? message;
}
