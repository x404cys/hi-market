"use client";

import type { AdminUserDto } from "@/lib/users/user-types";
import type { AuthenticatedAdmin } from "@/lib/auth/session-types";
import type { ApiErrorResponse, ApiSuccess } from "@/lib/products/product-types";
import { Button } from "@/components/ui/button";
import { Ban, Pencil, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserRowActions({
  user,
  currentUser,
}: {
  user: AdminUserDto;
  currentUser: AuthenticatedAdmin;
}) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canUpdate = currentUser.permissions.includes("users.update");
  const canDeactivate =
    currentUser.permissions.includes("users.deactivate") &&
    user.id !== currentUser.id;

  async function toggleActiveState() {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const json = (await response.json()) as
        | ApiSuccess<AdminUserDto>
        | ApiErrorResponse;

      if (!json.success) {
        setError(translateStatusError(json.message));
        return;
      }

      router.refresh();
    } catch {
      setError("تعذر الاتصال بواجهة المستخدمين.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        {canUpdate && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/users/${user.id}/edit`}>
              <Pencil className="size-4" />
              تعديل
            </Link>
          </Button>
        )}
        {canDeactivate && (
          <Button
            type="button"
            variant={user.isActive ? "destructive" : "outline"}
            size="sm"
            disabled={isUpdating}
            onClick={toggleActiveState}
          >
            {user.isActive ? <Ban className="size-4" /> : <RotateCcw className="size-4" />}
            {user.isActive ? "تعطيل" : "تفعيل"}
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function translateStatusError(message: string) {
  const messages: Record<string, string> = {
    "You cannot deactivate your own account": "لا يمكنك تعطيل حسابك الحالي.",
    "At least one active owner is required": "يجب إبقاء مالك نشط واحد على الأقل.",
    "You cannot modify this user": "لا يمكنك تعديل هذا المستخدم.",
    "User not found": "المستخدم غير موجود.",
  };

  return messages[message] ?? message ?? "تعذر تغيير حالة المستخدم.";
}
