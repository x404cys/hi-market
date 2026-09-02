import { BannerForm } from "@/components/dashboard/banners/banner-form";
import { requirePagePermission } from "@/lib/auth/guards";

export default async function NewBannerPage() {
  await requirePagePermission("banners.manage");

  return <BannerForm mode="create" />;
}
