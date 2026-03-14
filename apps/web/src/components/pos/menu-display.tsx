"use client";

import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Utensils,
  Search,
  X,
  Plus,
  Minus,
  LayoutGrid,
  Gift,
  Star,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useTranslation } from "@/i18n";
import { ProductDetailDialog } from "./product-detail-dialog";
import {
  ICON_MAP,
  gridContainer,
  gridItem,
  type CatalogProduct,
  type CatalogCategory,
  type Promotion,
} from "./menu-types";

const COMBOS_CATEGORY_ID = "__combos__";

export function MenuDisplay({
  catalog,
  promotions = [],
}: {
  catalog: CatalogCategory[];
  promotions?: Promotion[];
}) {
  const allCategory: CatalogCategory = useMemo(
    () => ({
      id: "__all__",
      name: "Todos",
      icon: null,
      products: catalog.flatMap((c) => c.products || []),
    }),
    [catalog],
  );
  const categories = useMemo(() => [allCategory, ...catalog], [allCategory, catalog]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("__all__");
  const [variantProduct, setVariantProduct] = useState<CatalogProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "name" | "price-asc" | "price-desc">("default");

  const searchRef = useRef<HTMLInputElement>(null);
  const cartItems = useCart((s) => s.items);
  const addItem = useCart((s) => s.addItem);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const { t } = useTranslation();

  const isComboView = selectedCategoryId === COMBOS_CATEGORY_ID;
  const activeCategory = categories.find((c) => c.id === selectedCategoryId);

  const products = useMemo(() => {
    if (isComboView) return [];
    const raw = activeCategory?.products || [];
    let filtered = raw;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = raw.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (sortBy === "name") return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "price-asc") return [...filtered].sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
    if (sortBy === "price-desc") return [...filtered].sort((a, b) => Number(b.basePrice) - Number(a.basePrice));
    return filtered;
  }, [activeCategory, searchQuery, sortBy, isComboView]);

  const filteredPromos = useMemo(() => {
    if (!isComboView) return [];
    if (!searchQuery.trim()) return promotions;
    const q = searchQuery.toLowerCase();
    return promotions.filter((p) => p.name.toLowerCase().includes(q));
  }, [promotions, isComboView, searchQuery]);

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
      productId: promo.id, // placeholder — backend ignores this when promotionId is set
      promotionId: promo.id,
      variantId: null,
      name: promo.name,
      price: Number(promo.promoPrice),
      quantity: 1,
      imageUrl: promo.imageUrl,
    });
  };

  const clearSearch = () => {
    setSearchQuery("");
    searchRef.current?.focus();
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 pt-1">
      {/* ── Category chips ── */}
      <ScrollArea className="w-full whitespace-nowrap mb-4">
        <div className="flex w-max gap-2 pb-1">
          {categories.map((category) => {
            const Icon =
              category.id === "__all__"
                ? LayoutGrid
                : (category.icon && ICON_MAP[category.icon]) || Utensils;
            const isActive = category.id === selectedCategoryId;
            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategoryId(category.id);
                  setSearchQuery("");
                }}
                className={`inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0 border ${
                  isActive
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:bg-accent"
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.name}
              </button>
            );
          })}

          {/* Combos chip — only shown when there are active promotions */}
          {promotions.length > 0 && (
            <button
              onClick={() => {
                setSelectedCategoryId(COMBOS_CATEGORY_ID);
                setSearchQuery("");
              }}
              className={`inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0 border ${
                isComboView
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-foreground border-border hover:bg-accent"
              }`}
            >
              <Gift className="w-4 h-4" />
              {t("promotions.combos")}
              <Badge
                variant="outline"
                className="ml-0.5 h-4 px-1 text-[10px] font-bold"
              >
                {promotions.length}
              </Badge>
            </button>
          )}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>

      {/* ── Search ── */}
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
        <input
          ref={searchRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("pos.searchProducts")}
          className="h-11 w-full rounded-2xl bg-muted/60 pl-11 pr-10 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:bg-muted/80 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/30 flex items-center justify-center transition-colors"
          >
            <X className="h-3 w-3 text-foreground/70" />
          </button>
        )}
      </div>

      {/* ── Sort row (hidden in combo view) ── */}
      {!isComboView && (
        <div className="flex items-center justify-end gap-0 mb-4">
          <span className="text-[11px] font-medium text-muted-foreground/50 mr-2">
            ordenar:
          </span>
          {([
            { key: "default",    label: "Default" },
            { key: "name",       label: "A–Z"     },
            { key: "price-asc",  label: "$ ↑"     },
            { key: "price-desc", label: "$ ↓"     },
          ] as const).map(({ key, label }, i, arr) => (
            <span key={key} className="flex items-center">
              <button
                type="button"
                onClick={() => setSortBy(key)}
                className={`text-[11px] font-semibold px-1.5 py-0.5 rounded transition-colors ${
                  sortBy === key
                    ? "text-foreground"
                    : "text-muted-foreground/50 hover:text-muted-foreground"
                }`}
              >
                {label}
              </button>
              {i < arr.length - 1 && (
                <span className="text-border text-[10px]">·</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* ── Combos grid ── */}
      <AnimatePresence mode="wait">
        {isComboView ? (
          filteredPromos.length === 0 ? (
            <motion.div
              key="empty-promo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center flex-1 py-20 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                <Gift className="w-6 h-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {searchQuery ? t("pos.noResults") : t("promotions.empty")}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={COMBOS_CATEGORY_ID}
              variants={gridContainer}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 pb-20"
            >
              {filteredPromos.map((promo) => {
                const inCart = getPromoCartItem(promo.id);
                return (
                  <motion.div key={promo.id} variants={gridItem}>
                    <Card size="sm" className="overflow-hidden py-0 gap-0 h-full flex flex-col ring-2 ring-primary/20">
                      <div className="relative aspect-4/3 overflow-hidden bg-muted/30">
                        <img
                          src={
                            promo.imageUrl ||
                            "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&h=400&fit=crop"
                          }
                          alt={promo.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-bold">
                          <Star className="w-3 h-3 fill-current" />
                          COMBO
                        </div>
                      </div>

                      <CardContent className="flex flex-col flex-1 px-4 pt-3 pb-4 gap-1">
                        <h3 className="text-sm font-bold leading-snug text-card-foreground line-clamp-1">
                          {promo.name}
                        </h3>

                        {promo.items.length > 0 && (
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {promo.items
                              .map((pi) =>
                                pi.variant
                                  ? `${pi.product?.name} (${pi.variant.name})`
                                  : pi.product?.name,
                              )
                              .filter(Boolean)
                              .join(" + ")}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-auto pt-2">
                          <div className="flex flex-col">
                            {promo.originalPrice && (
                              <span className="text-xs line-through text-muted-foreground/60">
                                S/{Number(promo.originalPrice).toFixed(2)}
                              </span>
                            )}
                            <span className="text-base font-bold tracking-tight text-primary">
                              S/{Number(promo.promoPrice).toFixed(2)}
                            </span>
                          </div>

                          {inCart ? (
                            <div className="flex items-center gap-0">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-l-lg rounded-r-none"
                                onClick={() => {
                                  if (inCart.quantity <= 1) removeItem(inCart.id);
                                  else updateQuantity(inCart.id, inCart.quantity - 1);
                                }}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </Button>
                              <div className="h-8 min-w-8 flex items-center justify-center border-y border-border text-sm font-bold tabular-nums bg-background px-1">
                                {inCart.quantity}
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-r-lg rounded-l-none"
                                onClick={() => updateQuantity(inCart.id, inCart.quantity + 1)}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-lg text-xs font-semibold gap-1"
                              onClick={() => addPromo(promo)}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              {t("pos.add")}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )
        ) : (
          products.length === 0 ? (
            <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center flex-1 py-20 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {searchQuery ? t("pos.noResults") : t("pos.emptyCategory")}
            </p>
          </motion.div>
          ) : (
          <motion.div
            key={selectedCategoryId}
            variants={gridContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 pb-20"
          >
            {products.map((product) => {
              const v = Array.isArray(product.variants) ? product.variants : [];
              const minPrice = v.length ? Math.min(...v.map((x) => Number(x.price))) : null;
              const price = minPrice ?? Number(product.basePrice);
              const inCart = getCartItem(product.id);

              return (
                <motion.div key={product.id} variants={gridItem}>
                  <Card size="sm" className="overflow-hidden py-0 gap-0 h-full flex flex-col">
                    <div className="relative aspect-4/3 overflow-hidden bg-muted/30">
                      <img
                        src={
                          product.imageUrl ||
                          "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=400&fit=crop"
                        }
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                      {product.hasVariants && v.length > 0 && (
                        <Badge
                          variant="outline"
                          className="absolute top-2.5 right-2.5 bg-background/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wide"
                        >
                          {v.length} opc.
                        </Badge>
                      )}
                    </div>

                    <CardContent className="flex flex-col flex-1 px-4 pt-3 pb-4 gap-1">
                      <h3 className="text-sm font-bold leading-snug text-card-foreground line-clamp-1">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1">
                          {product.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-2">
                        <span className="text-base font-bold tracking-tight text-card-foreground">
                          {minPrice !== null && (
                            <span className="text-[10px] font-medium text-muted-foreground mr-0.5">
                              desde{" "}
                            </span>
                          )}
                          S/{price.toFixed(2)}
                        </span>

                        {inCart ? (
                          <div className="flex items-center gap-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-l-lg rounded-r-none"
                              onClick={() => {
                                if (inCart.quantity <= 1) removeItem(inCart.id);
                                else updateQuantity(inCart.id, inCart.quantity - 1);
                              }}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </Button>
                            <div className="h-8 min-w-8 flex items-center justify-center border-y border-border text-sm font-bold tabular-nums bg-background px-1">
                              {inCart.quantity}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-r-lg rounded-l-none"
                              onClick={() => updateQuantity(inCart.id, inCart.quantity + 1)}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg text-xs font-semibold gap-1"
                            onClick={() => addProduct(product)}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {t("pos.add")}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
          )
        )}
      </AnimatePresence>

      {/* ── Product detail dialog ── */}
      <ProductDetailDialog
        product={variantProduct}
        onClose={() => setVariantProduct(null)}
      />
    </div>
  );
}
