import type {
  BrandOption,
  CategoryOption,
  ProductCardDto,
  ProductDto,
} from "@/lib/products/product-types";

export type StoreProduct = ProductCardDto;
export type StoreProductDetail = ProductDto;
export type StoreCategory = CategoryOption;
export type StoreBrand = BrandOption;

export type StoreBanner = {
  title: string;
  description: string;
  buttonText: string;
  href: string;
  imageSrc: string;
};
