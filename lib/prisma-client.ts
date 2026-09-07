import {
  BannerPosition as GeneratedBannerPosition,
  CouponType as GeneratedCouponType,
  OrderStatus as GeneratedOrderStatus,
  PaymentMethod as GeneratedPaymentMethod,
  PaymentStatus as GeneratedPaymentStatus,
  Prisma as GeneratedPrisma,
  PrismaClient as GeneratedPrismaClient,
  ProductStatus as GeneratedProductStatus,
  ProductUnit as GeneratedProductUnit,
  StockMovementType as GeneratedStockMovementType,
  UserRole as GeneratedUserRole,
} from "@/app/generated/prisma/client";

export const BannerPosition = GeneratedBannerPosition;
export const CouponType = GeneratedCouponType;
export const OrderStatus = GeneratedOrderStatus;
export const PaymentMethod = GeneratedPaymentMethod;
export const PaymentStatus = GeneratedPaymentStatus;
export const Prisma = GeneratedPrisma;
export const PrismaClient = GeneratedPrismaClient;
export const ProductStatus = GeneratedProductStatus;
export const ProductUnit = GeneratedProductUnit;
export const StockMovementType = GeneratedStockMovementType;
export const UserRole = GeneratedUserRole;

export type BannerPosition =
  (typeof BannerPosition)[keyof typeof BannerPosition];

export type CouponType =
  (typeof CouponType)[keyof typeof CouponType];

export type OrderStatus =
  (typeof OrderStatus)[keyof typeof OrderStatus];

export type PaymentMethod =
  (typeof PaymentMethod)[keyof typeof PaymentMethod];

export type PaymentStatus =
  (typeof PaymentStatus)[keyof typeof PaymentStatus];

export type ProductStatus =
  (typeof ProductStatus)[keyof typeof ProductStatus];

export type ProductUnit =
  (typeof ProductUnit)[keyof typeof ProductUnit];

export type StockMovementType =
  (typeof StockMovementType)[keyof typeof StockMovementType];

export type UserRole =
  (typeof UserRole)[keyof typeof UserRole];

export type {
  Banner,
  Brand,
  Category,
  DeliveryZone,
  Order,
  Product,
  User,
} from "@/app/generated/prisma/client";