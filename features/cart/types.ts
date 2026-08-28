import type { ProductUnit } from "@/app/generated/prisma";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  price: string;
  unit: ProductUnit;
  unitValue: string | null;
  minOrderQty: string;
  orderStep: string;
  quantity: number;
};

export type CartState = {
  items: CartItem[];
};
