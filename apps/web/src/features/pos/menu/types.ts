/**
 * POS Menu feature — types, constants and animation variants.
 *
 * Re-exports from the legacy menu-types module that is still consumed by
 * product-detail-dialog and other components during the migration.
 */

export type {
  CatalogProduct,
  CatalogCategory,
  CatalogProductsPage,
  ProductVariant,
  Modifier,
  ModifierGroup,
  Promotion,
  PromotionItem,
} from "@/components/pos/menu-types";

export { ICON_MAP, gridContainer, gridItem } from "@/components/pos/menu-types";

export const COMBOS_CATEGORY_ID = "__combos__";
export const PRODUCT_PAGE_SIZE = 10;
export const SEARCH_RESULTS_LIMIT = 8;
