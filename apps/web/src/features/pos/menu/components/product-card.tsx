"use client";

import { motion } from "framer-motion";
import { Plus, Minus, Check, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfig } from "@/hooks/useConfig";
import { gridItem } from "../types";
import type { CatalogProduct } from "../types";

interface ProductCardProps {
  product: CatalogProduct;
  categoryName?: string;
  inCart?: { id: string; quantity: number };
  onAdd: (product: CatalogProduct) => void;
  onIncrement: (cartId: string, qty: number) => void;
  onDecrement: (cartId: string, qty: number) => void;
  onRemove: (cartId: string) => void;
}

export function ProductCard({
  product,
  categoryName,
  inCart,
  onAdd,
  onIncrement,
  onDecrement,
  onRemove,
}: ProductCardProps) {
  const cs = useConfig((s) => s.currencySymbol);
  const v = Array.isArray(product.variants) ? product.variants : [];
  const minPrice = v.length ? Math.min(...v.map((x) => Number(x.price))) : null;
  const price = minPrice ?? Number(product.basePrice);

  return (
    <motion.div variants={gridItem}>
      <div
        className="h-full flex flex-col bg-card rounded-sm shadow-sm hover:shadow-lg transition-shadow group cursor-pointer overflow-hidden"
        onClick={() => onAdd(product)}
      >
        {/* Image */}
        <div className="relative aspect-3/2 overflow-hidden bg-muted/30">
          <img
            src={
              product.imageUrl ||
              "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=400&fit=crop"
            }
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {product.hasVariants && v.length > 0 && (
            <div className="absolute top-2.5 right-2.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-sm px-2.5 py-1 shadow">
              {v.length} opc.
            </div>
          )}
          {inCart && (
            <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold rounded-sm px-2.5 py-1 flex items-center gap-1.5 shadow">
              <ShoppingBag className="w-3 h-3" />
              &times; {inCart.quantity}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 px-3 pt-2 pb-0 gap-0.5">
          {categoryName && (
            <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
              {categoryName}
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

        {/* Bottom action bar */}
        <div
          className="bg-muted/30 px-3 py-2 flex items-center justify-between"
          onClick={(e) => e.stopPropagation()}
        >
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
                    if (inCart.quantity <= 1) onRemove(inCart.id);
                    else onDecrement(inCart.id, inCart.quantity - 1);
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
                  onClick={() => onIncrement(inCart.id, inCart.quantity + 1)}
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
                onClick={() => onAdd(product)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
