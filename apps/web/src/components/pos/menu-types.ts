import type { LucideIcon } from "lucide-react";
import {
  Pizza,
  Coffee,
  CupSoda,
  Croissant,
  Utensils,
  IceCream,
} from "lucide-react";

export type ProductVariant = {
  id: string;
  name: string;
  price: number;
  displayOrder?: number;
};

export type Modifier = {
  id: string;
  name: string;
  price: number;
  groupId: string;
  displayOrder?: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  description?: string | null;
  minSelections: number;
  maxSelections: number;
  displayOrder?: number;
  modifiers: Modifier[];
};

export type CatalogProduct = {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number;
  imageUrl?: string | null;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  modifierGroups?: ModifierGroup[];
};

export type CatalogCategory = {
  id: string;
  name: string;
  icon?: string | null;
  products?: CatalogProduct[];
};

export type PromotionItem = {
  id: string;
  promotionId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  isRequired: boolean;
  product?: {
    id: string;
    name: string;
    imageUrl?: string | null;
  };
  variant?: {
    id: string;
    name: string;
  } | null;
};

export type Promotion = {
  id: string;
  name: string;
  description?: string | null;
  promoPrice: number;
  originalPrice?: number | null;
  imageUrl?: string | null;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  displayOrder: number;
  items: PromotionItem[];
};

export const ICON_MAP: Record<string, LucideIcon> = {
  Pizza,
  Coffee,
  CupSoda,
  Croissant,
  Utensils,
  IceCream,
};

export const gridContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
};

export const gridItem = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0, 0, 0.2, 1] as const },
  },
};
