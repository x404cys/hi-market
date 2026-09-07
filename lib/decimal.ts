import { Prisma } from "@/lib/prisma-client";

import type { Prisma as PrismaTypes } from "@/app/generated/prisma/client";


export function toPrismaDecimal(value: string) {
  return new Prisma.Decimal(value);
}

export function decimalToString(value: PrismaTypes.Decimal | null | undefined) {
  return value == null ? null : value.toString();
}
//