import type {
  BrandOption,
  CategoryOption,
  ProductDto,
} from "@/lib/products/product-types";

export type StoreProduct = ProductDto;
export type StoreCategory = CategoryOption;
export type StoreBrand = BrandOption;

export type StoreBanner = {
  title: string;
  description: string;
  buttonText: string;
  href: string;
  imageSrc: string;
};
