"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Banknote,
  Smartphone,
  CreditCard,
  Check,
  Trash2,
  Split,
} from "lucide-react";
import { useTranslation } from "@/i18n";
import { useConfig } from "@/hooks/useConfig";
import { useCart } from "@/hooks/useCart";
import type { CartItem } from "@/hooks/useCart";

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  onConfirm: (payload: {
    paymentMethod: string;
    cashReceived?: number;
    referenceNumber?: string;
    cashAmount?: number;
    digitalAmount?: number;
    digitalMethod?: string;
  }) => void;
  isSubmitting: boolean;
}

export function PaymentDialog({
  isOpen,
  onOpenChange,
  items,
  subtotal,
  tax,
  totalAmount,
  onConfirm,
  isSubmitting,
}: PaymentDialogProps) {
  const { t } = useTranslation();
  const cs = useConfig((s) => s.currencySymbol);
  const removeItem = useCart((s) => s.removeItem);

  const [paymentType, setPaymentType] = useState<"CASH" | "DIGITAL" | "MIXED">("CASH");
  const [digitalMethod, setDigitalMethod] = useState<"YAPE" | "PLIN" | "CARD">(
    "YAPE",
  );
  const [cashReceived, setCashReceived] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [mixedCashAmount, setMixedCashAmount] = useState<string>("");
  const [mixedCashReceived, setMixedCashReceived] = useState<string>("");
  const [mixedDigitalMethod, setMixedDigitalMethod] = useState<"YAPE" | "PLIN" | "CARD">("YAPE");
  const [mixedReferenceNumber, setMixedReferenceNumber] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setPaymentType("CASH");
      setDigitalMethod("YAPE");
      setCashReceived("");
      setReferenceNumber("");
      setMixedCashAmount("");
      setMixedCashReceived("");
      setMixedDigitalMethod("YAPE");
      setMixedReferenceNumber("");
    }
  }, [isOpen]);

  const numCashReceived = parseFloat(cashReceived) || 0;
  const changeAmount = numCashReceived - totalAmount;
  const isCashValid = numCashReceived >= totalAmount;
  const isDigitalValid = referenceNumber.trim().length > 0;
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  // Mixed payment computed values
  const numMixedCash = parseFloat(mixedCashAmount) || 0;
  const numMixedDigital = totalAmount - numMixedCash;
  const numMixedReceived = parseFloat(mixedCashReceived) || 0;
  const mixedChangeAmount = numMixedReceived - numMixedCash;
  const isMixedValid =
    numMixedCash > 0 &&
    numMixedCash < totalAmount &&
    numMixedDigital > 0 &&
    numMixedReceived >= numMixedCash &&
    mixedReferenceNumber.trim().length > 0;

  const quickAmounts = [20, 50, 100, Math.ceil(totalAmount)];

  const handleSubmit = () => {
    if (paymentType === "CASH" && !isCashValid) return;
    if (paymentType === "DIGITAL" && !isDigitalValid) return;
    if (paymentType === "MIXED" && !isMixedValid) return;

    if (paymentType === "MIXED") {
      onConfirm({
        paymentMethod: "MIXED",
        cashReceived: numMixedReceived,
        cashAmount: numMixedCash,
        digitalAmount: numMixedDigital,
        digitalMethod: mixedDigitalMethod,
        referenceNumber: mixedReferenceNumber,
      });
      return;
    }

    onConfirm({
      paymentMethod: paymentType === "CASH" ? "CASH" : digitalMethod,
      cashReceived: paymentType === "CASH" ? numCashReceived : undefined,
      referenceNumber: paymentType === "DIGITAL" ? referenceNumber : undefined,
    });
  };

  const canSubmit =
    !isSubmitting &&
    items.length > 0 &&
    (paymentType === "CASH"
      ? isCashValid
      : paymentType === "DIGITAL"
        ? isDigitalValid
        : isMixedValid);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-sm border border-border bg-sidebar p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col [&>button]:top-4 [&>button]:right-4">
        {/* ── Total hero ── */}
        <div className="pt-7 pb-4 text-center shrink-0">
          <p className="text-3xl font-black text-foreground tracking-tight">
            {cs}{totalAmount.toFixed(2)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {totalQty} {totalQty === 1 ? "item" : "items"} · IGV {cs}{tax.toFixed(2)}
          </p>
        </div>

        {/* ── Items preview (scrollable) ── */}
        <div className="shrink-0 border-t border-border">
          <ScrollArea className={items.length > 3 ? "max-h-36" : ""}>
            <div className="px-5 py-3 space-y-0">
              {items.map((item) => {
                const lineTotal =
                  (item.price + (item.modifiersCost || 0)) * item.quantity;
                const detail = [
                  item.variantName,
                  item.modifiers?.map((m) => m.name).join(", "),
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 py-2 group"
                  >
                    {/* Thumbnail */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-8 h-8 rounded-sm object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-sm bg-muted/50 shrink-0" />
                    )}

                    {/* Name + details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-foreground leading-tight truncate">
                        {item.quantity}x {item.name}
                      </p>
                      {detail && (
                        <p className="text-[10px] text-muted-foreground leading-tight truncate">
                          {detail}
                        </p>
                      )}
                    </div>

                    {/* Price */}
                    <span className="text-[12px] font-semibold text-foreground shrink-0 tabular-nums">
                      {cs}{lineTotal.toFixed(2)}
                    </span>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive transition-colors shrink-0"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* ── Payment section ── */}
        <div className="px-5 pt-4 pb-5 space-y-4 border-t border-border">
          {/* Method cards */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentType("CASH")}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-md py-3 border transition-all",
                paymentType === "CASH"
                  ? "border-foreground bg-foreground/5"
                  : "border-border bg-background/40 hover:border-foreground/20",
              )}
            >
              {paymentType === "CASH" && (
                <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-foreground flex items-center justify-center">
                  <Check className="w-2 h-2 text-background" />
                </div>
              )}
              <Banknote className="w-4.5 h-4.5 text-foreground" />
              <span className="text-[11px] font-semibold text-foreground">
                {t("payment.cashTab")}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentType("DIGITAL")}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-md py-3 border transition-all",
                paymentType === "DIGITAL"
                  ? "border-foreground bg-foreground/5"
                  : "border-border bg-background/40 hover:border-foreground/20",
              )}
            >
              {paymentType === "DIGITAL" && (
                <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-foreground flex items-center justify-center">
                  <Check className="w-2 h-2 text-background" />
                </div>
              )}
              <Smartphone className="w-4.5 h-4.5 text-foreground" />
              <span className="text-[11px] font-semibold text-foreground">
                {t("payment.digitalTab")}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentType("MIXED")}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-md py-3 border transition-all",
                paymentType === "MIXED"
                  ? "border-foreground bg-foreground/5"
                  : "border-border bg-background/40 hover:border-foreground/20",
              )}
            >
              {paymentType === "MIXED" && (
                <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-foreground flex items-center justify-center">
                  <Check className="w-2 h-2 text-background" />
                </div>
              )}
              <Split className="w-4.5 h-4.5 text-foreground" />
              <span className="text-[11px] font-semibold text-foreground">
                {t("payment.mixedTab")}
              </span>
            </button>
          </div>

          {/* ── CASH ── */}
          {paymentType === "CASH" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">
                  S/
                </span>
                <Input
                  type="number"
                  step="0.10"
                  placeholder="0.00"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="h-10 text-sm font-bold rounded-md bg-background/40 border-border pl-9 focus-visible:ring-1 focus-visible:ring-foreground/20"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {quickAmounts.map((amt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCashReceived(amt.toString())}
                    className={cn(
                      "h-8 rounded-sm text-[11px] font-semibold transition-all",
                      cashReceived === amt.toString()
                        ? "bg-foreground text-background"
                        : "bg-background/40 text-foreground hover:bg-accent",
                    )}
                  >
                    {idx === quickAmounts.length - 1
                      ? t("payment.exact")
                      : `${cs}${amt}`}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">
                  {t("payment.change")}
                </span>
                <span
                  className={cn(
                    "text-[13px] font-bold",
                    isCashValid ? "text-primary" : "text-destructive",
                  )}
                >
                  {isCashValid
                    ? `${cs}${changeAmount.toFixed(2)}`
                    : t("payment.missingMoney")}
                </span>
              </div>
            </div>
          )}

          {/* ── DIGITAL ── */}
          {paymentType === "DIGITAL" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { key: "YAPE", label: t("payment.yape"), icon: null },
                    { key: "PLIN", label: t("payment.plin"), icon: null },
                    { key: "CARD", label: t("payment.card"), icon: CreditCard },
                  ] as const
                ).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDigitalMethod(key)}
                    className={cn(
                      "h-8 flex items-center justify-center gap-1 rounded-sm text-[11px] font-semibold transition-all",
                      digitalMethod === key
                        ? "bg-foreground text-background"
                        : "bg-background/40 text-foreground hover:bg-accent",
                    )}
                  >
                    {Icon && <Icon className="w-3 h-3" />}
                    {label}
                  </button>
                ))}
              </div>

              <Input
                type="text"
                placeholder={t("payment.referencePlaceholder")}
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="h-10 rounded-md bg-background/40 border-border text-sm font-medium uppercase focus-visible:ring-1 focus-visible:ring-foreground/20"
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground leading-tight">
                {t("payment.referenceHint")}
              </p>
            </div>
          )}

          {/* ── MIXED ── */}
          {paymentType === "MIXED" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* Cash amount */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  {t("payment.cashPortion")}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">
                    {cs}
                  </span>
                  <Input
                    type="number"
                    step="0.10"
                    placeholder="0.00"
                    value={mixedCashAmount}
                    onChange={(e) => {
                      setMixedCashAmount(e.target.value);
                      setMixedCashReceived(e.target.value);
                    }}
                    className="h-10 text-sm font-bold rounded-md bg-background/40 border-border pl-9 focus-visible:ring-1 focus-visible:ring-foreground/20"
                    autoFocus
                  />
                </div>
              </div>

              {/* Digital remainder */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  {t("payment.digitalRemainder")}
                </span>
                <span className={cn(
                  "text-sm font-bold",
                  numMixedDigital > 0 ? "text-primary" : "text-destructive",
                )}>
                  {cs}{numMixedDigital > 0 ? numMixedDigital.toFixed(2) : "0.00"}
                </span>
              </div>

              {/* Cash received */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  {t("payment.cashReceived")}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">
                    {cs}
                  </span>
                  <Input
                    type="number"
                    step="0.10"
                    placeholder="0.00"
                    value={mixedCashReceived}
                    onChange={(e) => setMixedCashReceived(e.target.value)}
                    className="h-10 text-sm font-bold rounded-md bg-background/40 border-border pl-9 focus-visible:ring-1 focus-visible:ring-foreground/20"
                  />
                </div>
                {numMixedCash > 0 && (
                  <div className="flex items-center justify-between mt-1.5 px-1">
                    <span className="text-[11px] text-muted-foreground">{t("payment.change")}</span>
                    <span className={cn(
                      "text-[12px] font-bold",
                      numMixedReceived >= numMixedCash ? "text-primary" : "text-destructive",
                    )}>
                      {numMixedReceived >= numMixedCash
                        ? `${cs}${mixedChangeAmount.toFixed(2)}`
                        : t("payment.missingMoney")}
                    </span>
                  </div>
                )}
              </div>

              {/* Digital method */}
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { key: "YAPE", label: t("payment.yape"), icon: null },
                    { key: "PLIN", label: t("payment.plin"), icon: null },
                    { key: "CARD", label: t("payment.card"), icon: CreditCard },
                  ] as const
                ).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMixedDigitalMethod(key)}
                    className={cn(
                      "h-8 flex items-center justify-center gap-1 rounded-sm text-[11px] font-semibold transition-all",
                      mixedDigitalMethod === key
                        ? "bg-foreground text-background"
                        : "bg-background/40 text-foreground hover:bg-accent",
                    )}
                  >
                    {Icon && <Icon className="w-3 h-3" />}
                    {label}
                  </button>
                ))}
              </div>

              {/* Reference number */}
              <Input
                type="text"
                placeholder={t("payment.referencePlaceholder")}
                value={mixedReferenceNumber}
                onChange={(e) => setMixedReferenceNumber(e.target.value)}
                className="h-10 rounded-md bg-background/40 border-border text-sm font-medium uppercase focus-visible:ring-1 focus-visible:ring-foreground/20"
              />
              <p className="text-[10px] text-muted-foreground leading-tight">
                {t("payment.mixedHint")}
              </p>
            </div>
          )}

          {/* ── CTA ── */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full h-11 rounded-md bg-foreground hover:bg-foreground/90 text-background font-bold text-sm tracking-wide transition-all active:scale-[0.98] disabled:opacity-30"
          >
            {isSubmitting
              ? t("payment.processing")
              : t("payment.confirmAndPrint")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
