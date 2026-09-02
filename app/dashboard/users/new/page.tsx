import { UserForm } from "@/components/dashboard/users/user-form";
import { requirePagePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  const currentUser = await requirePagePermission("users.create");

  return <UserForm mode="create" currentUser={currentUser} />;
}
