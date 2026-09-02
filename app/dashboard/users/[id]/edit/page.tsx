import { UserForm } from "@/components/dashboard/users/user-form";
import { ApiError } from "@/lib/api-response";
import { requirePagePermission } from "@/lib/auth/guards";
import { getAdminUserById } from "@/lib/services/user.service";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await requirePagePermission("users.update");
  const { id } = await params;
  const user = await loadUser(id);

  return <UserForm mode="edit" currentUser={currentUser} initialData={user} />;
}

async function loadUser(id: string) {
  try {
    return await getAdminUserById(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
