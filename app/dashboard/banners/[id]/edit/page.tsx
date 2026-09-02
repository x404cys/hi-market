import { notFound } from "next/navigation";
import { BannerForm } from "@/components/dashboard/banners/banner-form";
import { ApiError } from "@/lib/api-response";
import { requirePagePermission } from "@/lib/auth/guards";
import { getBannerById } from "@/lib/services/banner.service";
import { bannerIdSchema } from "@/lib/validations/banner";

type EditBannerPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditBannerPage({ params }: EditBannerPageProps) {
  await requirePagePermission("banners.manage");
  const { id } = await params;
  const bannerId = bannerIdSchema.parse(id);
  const banner = await getBannerById(bannerId).catch((error) => {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  });

  if (!banner) notFound();

  return <BannerForm mode="edit" initialData={banner} />;
}
