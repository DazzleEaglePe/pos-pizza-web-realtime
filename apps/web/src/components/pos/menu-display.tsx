"use client";

import { useMemo, useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Pizza,
  Coffee,
  CupSoda,
  Croissant,
  Utensils,
  IceCream,
  type LucideIcon,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useTranslation } from "@/i18n";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Map string icon names from DB to actual lucide-react components
const ICON_MAP: Record<string, LucideIcon> = {
  Pizza,
  Coffee,
  CupSoda,
  Croissant,
  Utensils,
  IceCream,
};

type ProductVariant = {
  id: string;
  name: string;
  price: number;
  displayOrder?: number;
};

type CatalogProduct = {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number;
  imageUrl?: string | null;
  hasVariants?: boolean;
  variants?: ProductVariant[];
};

type CatalogCategory = {
  id: string;
  name: string;
  icon?: string | null;
  products?: CatalogProduct[];
};

export function MenuDisplay({ catalog }: { catalog: CatalogCategory[] }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    catalog[0]?.id || null,
  );
  const [variantProduct, setVariantProduct] = useState<CatalogProduct | null>(
    null,
  );
  const addItem = useCart((state) => state.addItem);
  const { t } = useTranslation();

  const activeCategory = catalog.find((c) => c.id === selectedCategoryId);
  const products = activeCategory?.products || [];

  const variantsForDialog = useMemo(() => {
    const variants = Array.isArray(variantProduct?.variants)
      ? [...variantProduct!.variants]
      : [];
    variants.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    return variants;
  }, [variantProduct]);

  const addProduct = (product: CatalogProduct) => {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    if (product.hasVariants && variants.length > 0) {
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

  const addVariant = (variant: ProductVariant) => {
    if (!variantProduct) return;
    addItem({
      productId: variantProduct.id,
      variantId: variant.id,
      name: variantProduct.name,
      price: Number(variant.price),
      quantity: 1,
      imageUrl: variantProduct.imageUrl,
      variantName: variant.name,
    });
    setVariantProduct(null);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-6">
        {t("pos.categories")}
      </h1>

      {/* Categories Bar */}
      <ScrollArea className="w-full whitespace-nowrap mb-6 pb-2">
        <div className="flex w-max space-x-3 px-1">
          {catalog.map((category) => {
            const Icon = (category.icon && ICON_MAP[category.icon]) || Utensils;
            const isActive = category.id === selectedCategoryId;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className={`flex flex-col items-center justify-center gap-3 w-[100px] h-[110px] rounded-[18px] transition-all duration-200 border shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shrink-0 ${
                  isActive
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-accent/50"
                }`}
              >
                <div
                  className={`p-2.5 rounded-full ${isActive ? "bg-primary/10" : "bg-muted/50"}`}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span
                  className={`text-[13px] tracking-tight ${isActive ? "font-bold" : "font-semibold"}`}
                >
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>

      <div className="flex items-center justify-between mb-4 mt-2">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {activeCategory?.name || t("pos.menu")}
        </h2>
        <span className="text-sm font-medium text-muted-foreground">
          {t("pos.showingItems", { count: products.length })}
        </span>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-5 pb-24">
        {products.map((product) => {
          const v = Array.isArray(product.variants) ? product.variants : [];
          const minVariantPrice = v.length
            ? Math.min(...v.map((x) => Number(x.price)))
            : null;
          const displayPrice =
            minVariantPrice !== null
              ? minVariantPrice
              : Number(product.basePrice);

          return (
            <div
              key={product.id}
              className="group bg-card rounded-[20px] p-4 border border-border shadow-sm hover:shadow-md hover:border-border/80 transition-all text-left flex flex-col"
            >
              {/* Top Info: Image + Title/Price */}
              <div className="flex items-start gap-4 mb-3">
                <div className="w-[85px] h-[85px] shrink-0 rounded-2xl overflow-hidden relative bg-muted/30">
                  <img
                    src={
                      product.imageUrl ||
                      "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop"
                    }
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="flex flex-col flex-1 pt-1">
                  <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2">
                    {product.name}
                  </h3>
                  <span className="text-xs text-muted-foreground mt-1">
                    {product.hasVariants && v.length > 0
                      ? `${v.length} tamaños`
                      : t("pos.freshlyMade")}
                  </span>
                  <span className="text-lg font-black text-foreground mt-auto pt-2">
                    {minVariantPrice !== null ? "Desde " : ""}S/
                    {Number(displayPrice).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Spacer to push button down if titles vary in height */}
              <div className="flex-1" />

              {/* Action Button */}
              <button
                onClick={() => addProduct(product)}
                className="mt-4 w-full bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold py-3 rounded-full transition-colors duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {t("cart.addCheck")}
              </button>
            </div>
          );
        })}
      </div>

      <Dialog
        open={Boolean(variantProduct)}
        onOpenChange={(open) => {
          if (!open) setVariantProduct(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight">
              Selecciona tamano
            </DialogTitle>
            <div className="text-sm font-semibold text-muted-foreground">
              {variantProduct?.name}
            </div>
          </DialogHeader>

          <div className="mt-2 space-y-2">
            {variantsForDialog.map((variant) => (
              <Button
                key={variant.id}
                type="button"
                variant="outline"
                onClick={() => addVariant(variant)}
                className="w-full justify-between rounded-2xl h-12"
              >
                <span className="font-black">{variant.name}</span>
                <span className="font-black text-primary">
                  S/ {Number(variant.price).toFixed(2)}
                </span>
              </Button>
            ))}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setVariantProduct(null)}
              className="rounded-full"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
