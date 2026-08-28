import { Prisma } from "@/app/generated/prisma";

export function toPrismaDecimal(value: string) {
  return new Prisma.Decimal(value);
}

export function decimalToString(value: Prisma.Decimal | null | undefined) {
  return value == null ? null : value.toString();
}
