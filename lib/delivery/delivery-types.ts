export type DeliveryZoneDto = {
  id: string;
  name: string;
  governorate: string | null;
  city: string | null;
  fee: string;
  freeDeliveryFrom: string | null;
  minimumOrder: string | null;
  estimatedMinutesMin: number | null;
  estimatedMinutesMax: number | null;
};
