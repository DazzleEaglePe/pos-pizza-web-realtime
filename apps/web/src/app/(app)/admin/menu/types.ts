export type Variant = {
  id: string;
  productId: string;
  name: string;
  price: number;
  displayOrder: number;
  isActive: boolean;
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  imageUrl: string | null;
  hasVariants: boolean;
  isActive: boolean;
  displayOrder: number;
  variants: Variant[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  products: Product[];
};

export type CategoryForm = {
  id: string | null;
  name: string;
  icon: string;
  description: string;
  displayOrder: number;
};

export type ProductForm = {
  id: string | null;
  categoryId: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  displayOrder: number;
};

export type VariantDraft = {
  name: string;
  price: number;
  displayOrder: number;
};