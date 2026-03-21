"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";

interface CartFooterProps {
  cs: string;
  itemCount: number;
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  hasRegister: boolean;
  registerLoading: boolean;
  isSubmitting: boolean;
  onOpenPayment: () => void;
  onOpenRegister: () => void;
}

export function CartFooter({
  cs,
  itemCount,
  subtotal,
  tax,
  taxRate,
  total,
  hasRegister,
  registerLoading,
  isSubmitting,
  onOpenPayment,
  onOpenRegister,
}: CartFooterProps) {
  const { t } = useTranslation();

  return (
    <div className="border-t border-sidebar-border px-5 pt-4 pb-5 space-y-3 bg-sidebar">
      <div className="space-y-2">
        <div className="flex justify-between text-[13px] text-muted-foreground">
          <span>{t("cart.items")}</span>
          <span className="text-foreground font-medium">{itemCount}</span>
        </div>
        <div className="flex justify-between text-[13px] text-muted-foreground">
          <span>{t("cart.baseNet")}</span>
          <span className="text-foreground font-medium">{cs}{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[13px] text-muted-foreground">
          <span>{t("cart.discount")}</span>
          <span className="font-medium text-primary">- {cs}0.00</span>
        </div>
        <div className="flex justify-between text-[13px] text-muted-foreground">
          <span>{t("cart.tax")} ({taxRate}%) {t("cart.included")}</span>
          <span className="text-foreground font-medium">{cs}{tax.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-border/60">
        <span className="text-sm font-bold text-foreground uppercase tracking-wide">
          {t("cart.total")}
        </span>
        <span className="text-2xl font-black text-primary tracking-tight">
          {cs}{total.toFixed(2)}
        </span>
      </div>

      {!registerLoading && !hasRegister ? (
        <Button
          onClick={onOpenRegister}
          className="h-11 w-full rounded-md font-bold text-sm transition-all active:scale-[0.98] bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/30"
        >
          <Lock className="w-4 h-4 mr-2" />
          {t("cashRegister.openToCharge")}
        </Button>
      ) : (
        <Button
          onClick={onOpenPayment}
          disabled={itemCount === 0 || isSubmitting || registerLoading}
          className="h-12 w-full rounded-sm bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {t("cart.placeOrder")}
        </Button>
      )}
    </div>
  );
}
