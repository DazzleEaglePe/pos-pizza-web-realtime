"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Plus, Utensils } from "lucide-react";
import { useConfig } from "@/hooks/useConfig";
import { useTranslation } from "@/i18n";
import type { CatalogProduct } from "../types";

interface SearchBarProps {
  searchRef: React.RefObject<HTMLInputElement | null>;
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchFocused: (f: boolean) => void;
  showDropdown: boolean;
  searchResults: CatalogProduct[];
  onClearSearch: () => void;
  onAddProduct: (product: CatalogProduct) => void;
  getCartItem: (productId: string) => { quantity: number } | undefined;
}

export function SearchBar({
  searchRef,
  searchContainerRef,
  searchQuery,
  onSearchChange,
  onSearchFocused,
  showDropdown,
  searchResults,
  onClearSearch,
  onAddProduct,
  getCartItem,
}: SearchBarProps) {
  const cs = useConfig((s) => s.currencySymbol);
  const { t } = useTranslation();

  return (
    <div ref={searchContainerRef} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 z-10" />
      <input
        ref={searchRef}
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={() => onSearchFocused(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onSearchFocused(false);
            searchRef.current?.blur();
          }
        }}
        placeholder={t("pos.searchProducts")}
        className="h-10 sm:h-9 w-full rounded-md bg-muted/50 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:bg-muted/70 transition-colors"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={onClearSearch}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded bg-muted-foreground/15 hover:bg-muted-foreground/25 flex items-center justify-center transition-colors z-10"
        >
          <X className="h-3 w-3 text-foreground/60" />
        </button>
      )}

      {/* Floating results dropdown */}
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
                        onAddProduct(product);
                        onSearchFocused(false);
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
  );
}
