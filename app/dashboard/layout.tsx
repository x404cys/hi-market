import { AdminShell } from "@/components/dashboard/admin-shell";
import { requirePagePermission } from "@/lib/auth/guards";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requirePagePermission("dashboard.view");

  return <AdminShell currentUser={user}>{children}</AdminShell>;
}
