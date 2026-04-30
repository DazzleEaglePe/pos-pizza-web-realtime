"use client";

import { Pencil, Trash2, ShoppingBag, Minus, Plus } from "lucide-react";
import { useConfig } from "@/hooks/useConfig";
import { useTranslation } from "@/i18n";

export interface CartItem {
  id: string;
  name: string;
  variantName?: string | null;
  modifiers?: { name: string }[];
  modifiersCost?: number;
  price: number;
  quantity: number;
  notes?: string | null;
}

interface CartItemsProps {
  items: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
  onOpenNote: (id: string, currentNote: string | null) => void;
}

export function CartItems({ items, onRemove, onUpdateQuantity, onOpenNote }: CartItemsProps) {
  const cs = useConfig((s) => s.currencySymbol);
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="w-12 h-12 bg-muted/50 rounded-sm flex items-center justify-center">
          <ShoppingBag className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <p className="font-semibold text-foreground text-sm">{t("cart.noItemSelected")}</p>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-background/60 rounded-sm px-3.5 py-3 flex flex-col gap-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground leading-tight">{item.name}</p>
              {item.variantName && (
                <span className="text-[11px] text-muted-foreground block">{item.variantName}</span>
              )}
              {item.modifiers && item.modifiers.length > 0 && (
                <span className="text-[11px] text-muted-foreground block">
                  + {item.modifiers.map((m) => m.name).join(", ")}
                </span>
              )}
            </div>
            <span className="font-bold text-sm text-primary shrink-0">
              {cs}{((item.price + (item.modifiersCost || 0)) * item.quantity).toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  item.quantity <= 1 ? onRemove(item.id) : onUpdateQuantity(item.id, item.quantity - 1)
                }
                className="w-7 h-7 rounded-sm bg-muted/50 hover:bg-accent flex items-center justify-center transition-colors"
                aria-label={t("cart.decrease")}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-foreground w-5 text-center text-sm tabular-nums">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="w-7 h-7 rounded-sm bg-muted/50 hover:bg-accent flex items-center justify-center transition-colors"
                aria-label={t("cart.increase")}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenNote(item.id, item.notes ?? null)}
                className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors"
              >
                <Pencil className="w-3 h-3" />
                {item.notes ? t("cart.edit") : t("cart.add")} {t("cart.note").toLowerCase()}
              </button>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="flex items-center gap-1 px-2 py-1 rounded-sm text-[11px] font-semibold text-destructive bg-destructive/8 hover:bg-destructive/15 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Eliminar
              </button>
            </div>
          </div>

          {item.notes && (
            <div className="text-[11px] font-medium text-destructive bg-destructive/5 border border-destructive/15 rounded-sm px-2.5 py-1.5 leading-snug">
              {item.notes}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
