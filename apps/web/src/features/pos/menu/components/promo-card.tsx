"use client";

import { motion } from "framer-motion";
import { Plus, Minus, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useConfig } from "@/hooks/useConfig";
import { useTranslation } from "@/i18n";
import { gridItem } from "../types";
import type { Promotion } from "../types";

interface PromoCardProps {
  promo: Promotion;
  inCart?: { id: string; quantity: number };
  onAdd: (promo: Promotion) => void;
  onIncrement: (cartId: string, qty: number) => void;
  onDecrement: (cartId: string, qty: number) => void;
  onRemove: (cartId: string) => void;
}

export function PromoCard({
  promo,
  inCart,
  onAdd,
  onIncrement,
  onDecrement,
  onRemove,
}: PromoCardProps) {
  const cs = useConfig((s) => s.currencySymbol);
  const { t } = useTranslation();

  return (
    <motion.div variants={gridItem}>
      <Card
        size="sm"
        className="overflow-hidden py-0 gap-0 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow"
      >
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
                    if (inCart.quantity <= 1) onRemove(inCart.id);
                    else onDecrement(inCart.id, inCart.quantity - 1);
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
                  onClick={() => onIncrement(inCart.id, inCart.quantity + 1)}
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
                onClick={() => onAdd(promo)}
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
}
