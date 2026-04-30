"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCart } from "@/hooks/useCart";
import { useConfig } from "@/hooks/useConfig";
import { useTranslation } from "@/i18n";
import type { CatalogProduct, ProductVariant, Modifier, ModifierGroup } from "./menu-types";

type Props = {
  product: CatalogProduct | null;
  onClose: () => void;
};

export function ProductDetailDialog({ product, onClose }: Props) {
  const addItem = useCart((s) => s.addItem);
  const cs = useConfig((s) => s.currencySymbol);
  const { t } = useTranslation();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, Modifier[]>>({});
  const [localQty, setLocalQty] = useState(1);

  const variants = useMemo(() => {
    const v = Array.isArray(product?.variants) ? [...product!.variants] : [];
    v.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    return v;
  }, [product]);

  const modifierGroups = useMemo(() => {
    const groups = Array.isArray(product?.modifierGroups) ? [...product!.modifierGroups] : [];
    return groups.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [product]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setSelectedVariant(null);
      setSelectedModifiers({});
      setLocalQty(1);
    }
  };

  const handleAdd = () => {
    if (!product) return;
    const selectedMods = Object.values(selectedModifiers).flat();
    const modCost = selectedMods.reduce((s, m) => s + m.price, 0);

    if (selectedVariant) {
      addItem({
        productId: product.id,
        variantId: selectedVariant.id,
        name: product.name,
        price: Number(selectedVariant.price),
        quantity: localQty,
        imageUrl: product.imageUrl,
        variantName: selectedVariant.name,
        modifiers: selectedMods.length > 0 ? selectedMods : undefined,
        modifiersCost: modCost > 0 ? modCost : undefined,
      });
    } else {
      addItem({
        productId: product.id,
        variantId: null,
        name: product.name,
        price: Number(product.basePrice),
        quantity: localQty,
        imageUrl: product.imageUrl,
        modifiers: selectedMods.length > 0 ? selectedMods : undefined,
        modifiersCost: modCost > 0 ? modCost : undefined,
      });
    }
    onClose();
  };

  const toggleModifier = (group: ModifierGroup, modifier: Modifier) => {
    setSelectedModifiers((prev) => {
      const current = prev[group.id] || [];
      const exists = current.some((m) => m.id === modifier.id);
      if (exists) {
        return { ...prev, [group.id]: current.filter((m) => m.id !== modifier.id) };
      }
      if (group.maxSelections === 1) {
        return { ...prev, [group.id]: [modifier] };
      }
      if (current.length >= group.maxSelections) return prev;
      return { ...prev, [group.id]: [...current, modifier] };
    });
  };

  const isDisabled =
    (variants.length > 0 && !selectedVariant) ||
    modifierGroups
      .filter((g) => g.minSelections > 0)
      .some((g) => (selectedModifiers[g.id]?.length || 0) < g.minSelections);

  return (
    <Dialog open={Boolean(product)} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 gap-0 rounded-sm border border-border bg-background">
        {/* ── Product header ── */}
        <div className="flex items-start gap-3 p-4 border-b border-border">
          <div className="w-16 h-16 rounded-sm overflow-hidden bg-muted/40 shrink-0">
            <img
              src={
                product?.imageUrl ||
                "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=160&h=160&fit=crop"
              }
              alt={product?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="font-bold text-[15px] text-foreground leading-tight">
              {product?.name}
            </p>
            {product?.description && (
              <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                {product.description}
              </p>
            )}
            <p className="text-xl font-black text-foreground mt-1.5 tracking-tight">
              <span className="text-sm font-semibold align-super mr-0.5">{cs}</span>
              {(
                (
                  (selectedVariant
                    ? Number(selectedVariant.price)
                    : Number(product?.basePrice ?? 0)) +
                  Object.values(selectedModifiers)
                    .flat()
                    .reduce((s, m) => s + m.price, 0)
                ) * localQty
              ).toFixed(2)}
            </p>
          </div>
        </div>

        {/* ── Options body ── */}
        <div className="px-4 py-4 space-y-5">
          {/* Variant group */}
          {variants.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {t("pos.selectSize")}
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => {
                  const isActive = selectedVariant?.id === variant.id;
                  const label =
                    variant.name.length <= 4
                      ? variant.name
                      : variant.name
                          .split(/\s+/)
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 4);
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      title={`${variant.name} — ${cs}${Number(variant.price).toFixed(2)}`}
                      className={cn(
                        "w-11 h-11 rounded-full text-[11px] font-bold border-2 transition-all flex items-center justify-center shrink-0 select-none",
                        isActive
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-foreground border-border hover:border-foreground/30",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Modifier groups ── */}
          {modifierGroups.map((group) => {
            const selectedInGroup = selectedModifiers[group.id] || [];
            return (
              <div key={group.id} className="space-y-2.5">
                <div className="flex items-baseline gap-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {group.name}
                  </p>
                  {group.minSelections > 0 && (
                    <span className="text-[9px] font-bold text-destructive uppercase tracking-wider">
                      requerido
                    </span>
                  )}
                  {group.maxSelections > 1 && group.maxSelections < 99 && (
                    <span className="text-[9px] text-muted-foreground/60 ml-auto">
                      máx. {group.maxSelections}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.modifiers.map((modifier) => {
                    const isActive = selectedInGroup.some((m) => m.id === modifier.id);
                    const label =
                      modifier.name.length <= 5
                        ? modifier.name
                        : modifier.name
                            .split(/\s+/)
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 4);
                    return (
                      <button
                        key={modifier.id}
                        type="button"
                        onClick={() => toggleModifier(group, modifier)}
                        title={`${modifier.name}${
                          modifier.price > 0 ? ` +${cs}${modifier.price.toFixed(2)}` : ""
                        }`}
                        className={cn(
                          "h-11 min-w-11 px-3 rounded-full text-[11px] font-bold border-2 transition-all flex items-center justify-center gap-1 shrink-0 select-none",
                          isActive
                            ? "bg-foreground text-background border-foreground"
                            : "bg-background text-foreground border-border hover:border-foreground/30",
                        )}
                      >
                        {label}
                        {modifier.price > 0 && (
                          <span
                            className={cn(
                              "text-[9px]",
                              isActive ? "text-background/70" : "text-muted-foreground",
                            )}
                          >
                            +{modifier.price.toFixed(2)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* ── Quantity ── */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {t("cart.quantity")}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLocalQty((q) => Math.max(1, q - 1))}
                className="w-11 h-11 rounded-full border-2 border-border bg-background hover:bg-accent flex items-center justify-center transition-colors shrink-0"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-black text-foreground text-lg w-6 text-center tabular-nums">
                {localQty}
              </span>
              <button
                type="button"
                onClick={() => setLocalQty((q) => q + 1)}
                className="w-11 h-11 rounded-full border-2 border-foreground bg-foreground text-background hover:opacity-80 flex items-center justify-center transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="px-4 pb-4 pt-0">
          <Button
            disabled={isDisabled}
            onClick={handleAdd}
            className="w-full h-12 rounded-sm bg-foreground hover:opacity-90 text-background font-bold text-sm gap-2 disabled:opacity-30 transition-opacity"
          >
            <ShoppingCart className="w-4 h-4" />
            {t("pos.addToCart")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
