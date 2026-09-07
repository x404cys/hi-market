import type { Prisma as PrismaTypes } from "@/app/generated/prisma/edge";
import { decimalToString } from "@/lib/decimal";
import type { DeliveryZoneDto } from "@/lib/delivery/delivery-types";
import prisma from "@/lib/prisma";

const deliveryZoneSelect = {
  id: true,
  name: true,
  governorate: true,
  city: true,
  fee: true,
  freeDeliveryFrom: true,
  minimumOrder: true,
  estimatedMinutesMin: true,
  estimatedMinutesMax: true,
} satisfies PrismaTypes.DeliveryZoneSelect;

type DeliveryZoneRecord = PrismaTypes.DeliveryZoneGetPayload<{
  select: typeof deliveryZoneSelect;
}>;

export async function listActiveDeliveryZones() {
  const zones = await prisma.deliveryZone.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: deliveryZoneSelect,
  });

  return zones.map(serializeDeliveryZone);
}

export function serializeDeliveryZone(zone: DeliveryZoneRecord): DeliveryZoneDto {
  return {
    ...zone,
    fee: decimalToString(zone.fee) ?? "0",
    freeDeliveryFrom: decimalToString(zone.freeDeliveryFrom),
    minimumOrder: decimalToString(zone.minimumOrder),
  };
}
