export type CategoryStatus = "ACTIVE" | "INACTIVE";

export type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  parentId: string | null;
  parent: {
    id: string;
    name: string;
    slug: string;
  } | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  childCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CategoryListSummary = {
  total: number;
  active: number;
  inactive: number;
  used: number;
  empty: number;
};
