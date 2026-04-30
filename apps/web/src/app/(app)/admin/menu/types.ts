export type Variant = {
  id: string;
  productId: string;
  name: string;
  price: number;
  displayOrder: number;
  isActive: boolean;
};

export type Modifier = {
  id: string;
  groupId: string;
  name: string;
  price: number;
  isActive: boolean;
  displayOrder: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  description: string | null;
  minSelections: number;
  maxSelections: number;
  displayOrder: number;
  isActive: boolean;
  modifiers: Modifier[];
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
  modifierGroups: ModifierGroup[];
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

export type ModifierGroupForm = {
  id: string | null;
  name: string;
  description: string;
  minSelections: number;
  maxSelections: number;
  displayOrder: number;
};

export type ModifierDraft = {
  name: string;
  price: number;
  displayOrder: number;
};