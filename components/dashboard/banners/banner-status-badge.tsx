import { Badge } from "@/components/ui/badge";
import {
  bannerDisplayStatusLabels,
  bannerStatusTone,
} from "@/lib/banners/banner-format";
import type { BannerDisplayStatus } from "@/lib/banners/banner-types";
import { cn } from "@/lib/utils";

export function BannerStatusBadge({ status }: { status: BannerDisplayStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full border px-2.5", bannerStatusTone[status])}
    >
      {bannerDisplayStatusLabels[status]}
    </Badge>
  );
}
