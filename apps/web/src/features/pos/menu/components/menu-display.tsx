"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Search, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/hooks/useCart";
import { useTranslation } from "@/i18n";
import { ProductDetailDialog } from "@/components/pos/product-detail-dialog";

import { useMenuFilters } from "../hooks/use-menu-filters";
import { SearchBar } from "./search-bar";
import { CategoryTabs } from "./category-tabs";
import { ProductCard } from "./product-card";
import { PromoCard } from "./promo-card";
import { gridContainer, COMBOS_CATEGORY_ID } from "../types";
import type { CatalogCategory, CatalogProduct, Promotion } from "../types";

export function MenuDisplay({
  categories: initialCategories,
  promotions = [],
}: {
  categories: CatalogCategory[];
  promotions?: Promotion[];
}) {
  const { t } = useTranslation();
  const cartItems = useCart((s) => s.items);
  const addItem = useCart((s) => s.addItem);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);

  const [variantProduct, setVariantProduct] = useState<CatalogProduct | null>(null);

  const filters = useMenuFilters(initialCategories, promotions);

  /* ── cart helpers ── */
  const getCartItem = (productId: string) =>
    cartItems.find((i) => i.productId === productId && !i.variantId && !i.promotionId);

  const getPromoCartItem = (promotionId: string) =>
    cartItems.find((i) => i.promotionId === promotionId);

  const addProduct = (product: CatalogProduct) => {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const hasModGroups = (product.modifierGroups || []).length > 0;
    if ((product.hasVariants && variants.length > 0) || hasModGroups) {
      setVariantProduct(product);
      return;
    }
    addItem({
      productId: product.id,
      variantId: null,
      name: product.name,
      price: Number(product.basePrice),
      quantity: 1,
      imageUrl: product.imageUrl,
    });
  };

  const addPromo = (promo: Promotion) => {
    addItem({
      productId: promo.id,
      promotionId: promo.id,
      variantId: null,
      name: promo.name,
      price: Number(promo.promoPrice),
      quantity: 1,
      imageUrl: promo.imageUrl,
    });
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-w-0 overflow-x-hidden py-3 gap-0 lg:gap-4">
      {/* ── LEFT: Search + Categories ── */}
      <div className="lg:w-56 xl:w-60 shrink-0 flex flex-col gap-2 lg:py-1">
        <SearchBar
          searchQuery={filters.searchQuery}
          onSearchChange={filters.setSearchQuery}
          onSearchFocused={filters.setSearchFocused}
          searchRef={filters.searchRef}
          searchContainerRef={filters.searchContainerRef}
          showDropdown={filters.showDropdown}
          searchResults={filters.searchResults}
          onClearSearch={filters.clearSearch}
          onAddProduct={addProduct}
          getCartItem={getCartItem}
        />

        <CategoryTabs
          categories={filters.categories}
          selectedCategoryId={filters.selectedCategoryId}
          onCategoryChange={(id) => {
            filters.setSelectedCategoryId(id);
            filters.setSearchQuery("");
          }}
          isComboView={filters.isComboView}
          totalProductCount={filters.totalProductCount}
          promotionsCount={promotions.length}
        />
      </div>

      {/* ── RIGHT: Product / Combo grid ── */}
      <div className="relative flex-1 min-w-0">
        <ScrollArea className="h-full pr-1">
          <AnimatePresence mode="wait">
            {filters.isComboView ? (
              filters.filteredPromos.length === 0 ? (
                <motion.div
                  key="empty-promo"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center flex-1 py-16 text-center"
                >
                  <div className="w-12 h-12 rounded-sm bg-muted/50 flex items-center justify-center mb-3">
                    <Gift className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-[13px] text-muted-foreground">
                    {filters.searchQuery ? t("pos.noResults") : t("promotions.empty")}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={COMBOS_CATEGORY_ID}
                  variants={gridContainer}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pb-6"
                >
                  {filters.filteredPromos.map((promo) => (
                    <PromoCard
                      key={promo.id}
                      promo={promo}
                      inCart={getPromoCartItem(promo.id)}
                      onAdd={addPromo}
                      onIncrement={updateQuantity}
                      onDecrement={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </motion.div>
              )
            ) : filters.isLoadingProducts ? (
              <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
                <LoaderCircle className="w-5 h-5 animate-spin text-muted-foreground/70 mb-3" />
                <p className="text-[13px] text-muted-foreground">{t("pos.loadingProducts")}</p>
              </div>
            ) : filters.visibleProducts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center flex-1 py-16 text-center"
              >
                <div className="w-12 h-12 rounded-sm bg-muted/50 flex items-center justify-center mb-3">
                  <Search className="w-5 h-5 text-muted-foreground/50" />
                </div>
                <p className="text-[13px] text-muted-foreground">
                  {filters.searchQuery ? t("pos.noResults") : t("pos.emptyCategory")}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={filters.selectedCategoryId}
                variants={gridContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pb-6"
              >
                {filters.visibleProducts.map((product) => {
                  const inCart = getCartItem(product.id);
                  const catName = product.categoryId
                    ? filters.categoryMap.get(product.categoryId)
                    : undefined;
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      categoryName={catName}
                      inCart={inCart}
                      onAdd={addProduct}
                      onIncrement={updateQuantity}
                      onDecrement={updateQuantity}
                      onRemove={removeItem}
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Load more */}
          {!filters.isComboView && filters.visibleProducts.length > 0 && (
            <div className="flex flex-col items-center gap-3 pt-2 pb-6 px-1">
              <p className="text-[12px] text-muted-foreground text-center">
                {t("pos.showingItems", { count: filters.visibleProducts.length })} ·{" "}
                {filters.productsTotal}
              </p>
              {filters.hasMoreProducts && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-full sm:w-auto rounded-md px-4 text-[12px] font-medium"
                  onClick={filters.loadMoreProducts}
                  disabled={filters.isLoadingMoreProducts}
                >
                  {filters.isLoadingMoreProducts ? (
                    <>
                      <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                      {t("pos.loadingMore")}
                    </>
                  ) : (
                    t("pos.viewMoreProducts")
                  )}
                </Button>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Bottom fade overlay */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-background to-transparent z-10" />
      </div>

      {/* ── Product detail dialog ── */}
      <ProductDetailDialog
        product={variantProduct}
        onClose={() => setVariantProduct(null)}
      />
    </div>
  );
}
