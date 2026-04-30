"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
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
  LoaderCircle,
  Check,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useConfig } from "@/hooks/useConfig";
import { useTranslation } from "@/i18n";
import { ProductDetailDialog } from "./product-detail-dialog";
import { apiFetch } from "@/lib/api";
import {
  ICON_MAP,
  gridContainer,
  gridItem,
  type CatalogProduct,
  type CatalogCategory,
  type CatalogProductsPage,
  type Promotion,
} from "./menu-types";

const COMBOS_CATEGORY_ID = "__combos__";
const PRODUCT_PAGE_SIZE = 10;
const SEARCH_RESULTS_LIMIT = 8;

export function MenuDisplay({
  categories: initialCategories,
  promotions = [],
}: {
  categories: CatalogCategory[];
  promotions?: Promotion[];
}) {
  const allCategory: CatalogCategory = useMemo(
    () => ({
      id: "__all__",
      name: "Todos",
      icon: null,
    }),
    [],
  );
  const categories = useMemo(() => [allCategory, ...initialCategories], [allCategory, initialCategories]);
  const cs = useConfig((s) => s.currencySymbol);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("__all__");
  const [variantProduct, setVariantProduct] = useState<CatalogProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "name" | "price-asc" | "price-desc">("default");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productsOffset, setProductsOffset] = useState(0);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingMoreProducts, setIsLoadingMoreProducts] = useState(false);
  const [searchResults, setSearchResults] = useState<CatalogProduct[]>([]);

  const searchRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const cartItems = useCart((s) => s.items);
  const addItem = useCart((s) => s.addItem);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const { t } = useTranslation();
  const isComboView = selectedCategoryId === COMBOS_CATEGORY_ID;

  const showDropdown = searchQuery.trim().length > 0 && searchFocused;

  const fetchProducts = useCallback(
    async ({ offset = 0, append = false }: { offset?: number; append?: boolean }) => {
      const query = new URLSearchParams();
      query.set("limit", String(PRODUCT_PAGE_SIZE));
      query.set("offset", String(offset));

      if (selectedCategoryId !== "__all__") {
        query.set("categoryId", selectedCategoryId);
      }

      if (debouncedSearchQuery.trim()) {
        query.set("search", debouncedSearchQuery.trim());
      }

      if (append) setIsLoadingMoreProducts(true);
      else setIsLoadingProducts(true);

      try {
        const response = await apiFetch<CatalogProductsPage>(`/catalog/products?${query.toString()}`);
        setProducts((current) => (append ? [...current, ...response.items] : response.items));
        setProductsTotal(response.total);
        setProductsOffset(response.offset + response.items.length);
        setHasMoreProducts(response.hasMore);
      } finally {
        setIsLoadingProducts(false);
        setIsLoadingMoreProducts(false);
      }
    },
    [debouncedSearchQuery, selectedCategoryId],
  );

  const loadMoreProducts = useCallback(() => {
    if (isComboView || isLoadingMoreProducts || !hasMoreProducts) return;
    void fetchProducts({ offset: productsOffset, append: true });
  }, [fetchProducts, hasMoreProducts, isComboView, isLoadingMoreProducts, productsOffset]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    if (isComboView) return;
    void fetchProducts({ offset: 0, append: false });
  }, [fetchProducts, isComboView]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    let active = true;

    const run = async () => {
      const query = new URLSearchParams();
      query.set("search", searchQuery.trim());
      query.set("limit", String(SEARCH_RESULTS_LIMIT));
      query.set("offset", "0");

      try {
        const response = await apiFetch<CatalogProductsPage>(`/catalog/products?${query.toString()}`);
        if (active) setSearchResults(response.items);
      } catch {
        if (active) setSearchResults([]);
      }
    };

    const timeout = window.setTimeout(() => {
      void run();
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [searchQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const visibleProducts = useMemo(() => {
    if (sortBy === "name") return [...products].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "price-asc") return [...products].sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
    if (sortBy === "price-desc") return [...products].sort((a, b) => Number(b.basePrice) - Number(a.basePrice));
    return products;
  }, [products, sortBy]);

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

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of initialCategories) map.set(c.id, c.name);
    return map;
  }, [initialCategories]);

  const isAllView = selectedCategoryId === "__all__";

  const totalProductCount = useMemo(
    () => initialCategories.reduce((sum, c) => sum + (c.productCount ?? 0), 0),
    [initialCategories],
  );

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-w-0 overflow-x-hidden py-3 gap-0 lg:gap-4">
      {/* ══════════════════════════════════════════════════════
          LEFT SIDEBAR — Categories + Search (desktop)
          On mobile: horizontal tabs + search on top
         ══════════════════════════════════════════════════════ */}
      <div className="lg:w-56 xl:w-60 shrink-0 flex flex-col gap-2 lg:py-1">
        {/* ── Search ── */}
        <div ref={searchContainerRef} className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 z-10" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchFocused(false);
                searchRef.current?.blur();
              }
            }}
            placeholder={t("pos.searchProducts")}
            className="h-10 sm:h-9 w-full rounded-md bg-muted/50 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:bg-muted/70 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded bg-muted-foreground/15 hover:bg-muted-foreground/25 flex items-center justify-center transition-colors z-10"
            >
              <X className="h-3 w-3 text-foreground/60" />
            </button>
          )}

          {/* ── Floating results dropdown ── */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border border-border rounded-md shadow-lg overflow-hidden max-h-[70vh] sm:max-h-90"
              >
                {searchResults.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <Search className="w-4 h-4 text-muted-foreground/40 mx-auto mb-1.5" />
                    <p className="text-[13px] text-muted-foreground">{t("pos.noResults")}</p>
                  </div>
                ) : (
                  <div className="py-1">
                    {searchResults.map((product) => {
                      const v = Array.isArray(product.variants) ? product.variants : [];
                      const minPrice = v.length ? Math.min(...v.map((x) => Number(x.price))) : null;
                      const price = minPrice ?? Number(product.basePrice);
                      const inCart = getCartItem(product.id);

                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            addProduct(product);
                            setSearchFocused(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-accent/60 transition-colors text-left"
                        >
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-9 h-9 rounded object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded bg-muted/50 flex items-center justify-center shrink-0">
                              <Utensils className="w-3.5 h-3.5 text-muted-foreground/40" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-foreground truncate">{product.name}</p>
                            {product.description && (
                              <p className="text-[11px] text-muted-foreground truncate">{product.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {inCart && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                {inCart.quantity}
                              </span>
                            )}
                            <span className="text-[13px] font-semibold text-primary whitespace-nowrap">
                              {cs}{price.toFixed(2)}
                            </span>
                            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                              <Plus className="w-3 h-3 text-primary" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Category list: vertical on desktop, horizontal scroll on mobile ── */}
        {/* Mobile: horizontal tabs */}
        <div className="lg:hidden min-w-0 border-b border-border/40">
          <ScrollArea className="min-w-0 whitespace-nowrap -mx-3 px-3">
            <div className="flex w-max gap-0 pr-3">
              {categories.map((category) => {
                const Icon =
                  category.id === "__all__"
                    ? LayoutGrid
                    : (category.icon && ICON_MAP[category.icon]) || Utensils;
                const isActive = category.id === selectedCategoryId;
                const count = category.id === "__all__"
                  ? totalProductCount
                  : (category.productCount ?? 0);
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategoryId(category.id);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "relative inline-flex items-center gap-1.5 h-10 px-3 text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {category.name}
                    {count > 0 && (
                      <span className={cn(
                        "ml-0.5 text-[11px] font-bold tabular-nums",
                        isActive ? "text-primary" : "text-muted-foreground/60",
                      )}>
                        {count}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
              {promotions.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedCategoryId(COMBOS_CATEGORY_ID);
                    setSearchQuery("");
                  }}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 h-10 px-3 text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0",
                    isComboView
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Gift className="w-4 h-4" />
                  {t("promotions.combos")}
                  <span className={cn(
                    "ml-0.5 text-[11px] font-bold tabular-nums",
                    isComboView ? "text-primary" : "text-muted-foreground/60",
                  )}>
                    {promotions.length}
                  </span>
                  {isComboView && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              )}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>

        {/* Desktop: vertical category list */}
        <nav className="hidden lg:flex flex-col gap-0.5 flex-1 overflow-y-auto custom-scrollbar">
          {categories.map((category) => {
            const Icon =
              category.id === "__all__"
                ? LayoutGrid
                : (category.icon && ICON_MAP[category.icon]) || Utensils;
            const isActive = category.id === selectedCategoryId;
            const count = category.id === "__all__"
              ? totalProductCount
              : (category.productCount ?? 0);
            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategoryId(category.id);
                  setSearchQuery("");
                }}
                className={cn(
                  "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-sm text-[13px] font-medium transition-colors text-left",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate">{category.name}</span>
                {count > 0 && (
                  <span className={cn(
                    "text-[11px] font-bold tabular-nums",
                    isActive ? "text-primary/70" : "text-muted-foreground/40",
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
          {promotions.length > 0 && (
            <button
              onClick={() => {
                setSelectedCategoryId(COMBOS_CATEGORY_ID);
                setSearchQuery("");
              }}
              className={cn(
                "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-sm text-[13px] font-medium transition-colors text-left",
                isComboView
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <Gift className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{t("promotions.combos")}</span>
              <span className={cn(
                "text-[11px] font-bold tabular-nums",
                isComboView ? "text-primary/70" : "text-muted-foreground/40",
              )}>
                {promotions.length}
              </span>
            </button>
          )}
        </nav>
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT CONTENT — Product / Combo grid
         ══════════════════════════════════════════════════════ */}
      <div className="relative flex-1 min-w-0">
        <ScrollArea className="h-full pr-1">
          <AnimatePresence mode="wait">
            {isComboView ? (
              filteredPromos.length === 0 ? (
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
                  {searchQuery ? t("pos.noResults") : t("promotions.empty")}
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
                {filteredPromos.map((promo) => {
                  const inCart = getPromoCartItem(promo.id);
                  return (
                    <motion.div key={promo.id} variants={gridItem}>
                      <Card size="sm" className="overflow-hidden py-0 gap-0 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
                        <div className="relative aspect-3/2 overflow-hidden bg-muted/20">
                          <img
                            src={
                              promo.imageUrl ||
                              "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&h=400&fit=crop"
                            }
                            alt={promo.name}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-[10px] font-bold">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            COMBO
                          </div>
                        </div>

                        <CardContent className="flex flex-col flex-1 px-3 pt-2.5 pb-3 gap-0.5">
                          <h3 className="text-[13px] font-semibold leading-tight text-card-foreground line-clamp-1">
                            {promo.name}
                          </h3>

                          {promo.items.length > 0 && (
                            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
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
                                <span className="text-[10px] line-through text-muted-foreground/50">
                                  {cs}{Number(promo.originalPrice).toFixed(2)}
                                </span>
                              )}
                              <span className="text-sm font-bold tracking-tight text-primary">
                                {cs}{Number(promo.promoPrice).toFixed(2)}
                              </span>
                            </div>

                            {inCart ? (
                              <div className="flex items-center gap-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-l-md rounded-r-none bg-muted/40 hover:bg-muted"
                                  onClick={() => {
                                    if (inCart.quantity <= 1) removeItem(inCart.id);
                                    else updateQuantity(inCart.id, inCart.quantity - 1);
                                  }}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <div className="h-7 min-w-7 flex items-center justify-center text-[13px] font-bold tabular-nums bg-muted/60 px-0.5">
                                  {inCart.quantity}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-r-md rounded-l-none bg-muted/40 hover:bg-muted"
                                  onClick={() => updateQuantity(inCart.id, inCart.quantity + 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 rounded-md text-[11px] font-medium gap-1 px-2.5 shrink-0 bg-muted/40 hover:bg-muted"
                                onClick={() => addPromo(promo)}
                              >
                                <Plus className="w-3 h-3" />
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
            isLoadingProducts ? (
              <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
                <LoaderCircle className="w-5 h-5 animate-spin text-muted-foreground/70 mb-3" />
                <p className="text-[13px] text-muted-foreground">{t("pos.loadingProducts")}</p>
              </div>
            ) : visibleProducts.length === 0 ? (
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
                  {searchQuery ? t("pos.noResults") : t("pos.emptyCategory")}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedCategoryId}
                variants={gridContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pb-6"
              >
                {visibleProducts.map((product) => {
                  const v = Array.isArray(product.variants) ? product.variants : [];
                  const minPrice = v.length ? Math.min(...v.map((x) => Number(x.price))) : null;
                  const price = minPrice ?? Number(product.basePrice);
                  const inCart = getCartItem(product.id);
                  const catName = product.categoryId ? categoryMap.get(product.categoryId) : undefined;

                  return (
                    <motion.div key={product.id} variants={gridItem}>
                      <div
                        className="h-full flex flex-col bg-card rounded-sm shadow-sm hover:shadow-lg transition-shadow group cursor-pointer overflow-hidden"
                        onClick={() => addProduct(product)}
                      >
                        {/* ── Image ── */}
                        <div className="relative aspect-3/2 overflow-hidden bg-muted/30">
                          <img
                            src={
                              product.imageUrl ||
                              "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=400&fit=crop"
                            }
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />

                          {/* Variant badge — top-right like "Stock: 24" */}
                          {product.hasVariants && v.length > 0 && (
                            <div className="absolute top-2.5 right-2.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-sm px-2.5 py-1 shadow">
                              {v.length} opc.
                            </div>
                          )}

                          {/* In-cart badge — bottom-left like "20 min" */}
                          {inCart && (
                            <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold rounded-sm px-2.5 py-1 flex items-center gap-1.5 shadow">
                              <ShoppingBag className="w-3 h-3" />
                              × {inCart.quantity}
                            </div>
                          )}
                        </div>

                        {/* ── Content ── */}
                        <div className="flex flex-col flex-1 px-3 pt-2 pb-0 gap-0.5">
                          {/* Category */}
                          {catName && (
                            <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                              {catName}
                            </span>
                          )}

                          <h3 className="text-[13px] font-bold leading-snug text-card-foreground line-clamp-1">
                            {product.name}
                          </h3>

                          {product.description && (
                            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-1 mt-0.5">
                              {product.description}
                            </p>
                          )}

                          {/* Price row */}
                          <div className="flex items-end justify-between mt-auto pt-1.5 pb-2">
                            <div className="flex flex-col gap-0">
                              <span className="text-sm font-black tracking-tight text-primary leading-none">
                                {cs} {price.toFixed(2)}
                              </span>
                              {minPrice !== null && (
                                <span className="text-[9px] font-medium text-muted-foreground/50 mt-0.5">
                                  desde
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ── Bottom action bar ── */}
                        <div className="bg-muted/30 px-3 py-2 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                          {inCart ? (
                            <>
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                                <span className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 text-primary" />
                                </span>
                                En pedido
                              </div>
                              <div className="flex items-center gap-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-l-md rounded-r-none bg-muted/40 hover:bg-muted"
                                  onClick={() => {
                                    if (inCart.quantity <= 1) removeItem(inCart.id);
                                    else updateQuantity(inCart.id, inCart.quantity - 1);
                                  }}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <div className="h-7 min-w-7 flex items-center justify-center text-[13px] font-bold tabular-nums bg-muted/60 px-1">
                                  {inCart.quantity}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-r-md rounded-l-none bg-muted/40 hover:bg-muted"
                                  onClick={() => updateQuantity(inCart.id, inCart.quantity + 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <span className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 text-emerald-500" />
                                </span>
                                Disponible
                              </div>
                              <Button
                                type="button"
                                size="icon"
                                className="h-8 w-8 rounded-sm bg-primary/10 hover:bg-primary/20 text-primary"
                                variant="ghost"
                                onClick={() => addProduct(product)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )
          )}
        </AnimatePresence>

        {!isComboView && visibleProducts.length > 0 && (
          <div className="flex flex-col items-center gap-3 pt-2 pb-6 px-1">
            <p className="text-[12px] text-muted-foreground text-center">
              {t("pos.showingItems", { count: visibleProducts.length })} · {productsTotal}
            </p>
            {hasMoreProducts && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-full sm:w-auto rounded-md px-4 text-[12px] font-medium"
                onClick={loadMoreProducts}
                disabled={isLoadingMoreProducts}
              >
                {isLoadingMoreProducts ? (
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
