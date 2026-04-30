"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { LockOpen, Lock, DollarSign, Clock, Banknote, CreditCard, Receipt, ArrowRight, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { useTranslation } from "@/i18n";
import { useConfig } from "@/hooks/useConfig";
import { posAlert } from "@/lib/sweetalert";
import { handleApiError } from "@/lib/api-error-handler";
import type { ReactNode } from "react";
import type { CashRegisterSummary } from "@/hooks/useCashRegister";

type CashRegister = {
  id: string;
  openedAt: string;
  openingAmount: number;
  status: string;
};

type Props = {
  register: CashRegister | null;
  loading: boolean;
  onOpen: (openingAmount: number) => Promise<unknown>;
  onClose: (actualCash: number, notes?: string) => Promise<{
    expectedCash?: number | null;
    actualCash?: number | null;
    difference?: number | null;
    totalSales?: number | null;
    totalCashSales?: number | null;
    totalDigitalSales?: number | null;
    totalTickets?: number | null;
  }>;
  onFetchSummary: () => Promise<CashRegisterSummary | null>;
  /** Incrementing this value from the parent forces the open-register dialog to appear */
  triggerOpen?: number;
};

function StatRow({ icon, label, value, highlight, className }: { icon: ReactNode; label: string; value: string; highlight?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between py-1.5", className)}>
      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
        {icon}
        {label}
      </div>
      <span className={cn("text-sm font-bold tabular-nums", highlight ? "text-primary" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-border/50 my-1" />;
}

export function CashRegisterBar({ register, loading, onOpen, onClose, onFetchSummary, triggerOpen }: Props) {
  const { t } = useTranslation();
  const cs = useConfig((s) => s.currencySymbol);
  const [dialogMode, setDialogMode] = useState<"open" | "close" | null>(null);

  // Allow parent to force-open the register dialog by incrementing triggerOpen
  useEffect(() => {
    if (triggerOpen && triggerOpen > 0 && !register && !loading) {
      setDialogMode("open");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerOpen]);
  const [openingAmount, setOpeningAmount] = useState("");
  const [actualCash, setActualCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<CashRegisterSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Fetch summary when close dialog opens
  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    const data = await onFetchSummary();
    setSummary(data);
    setSummaryLoading(false);
  }, [onFetchSummary]);

  useEffect(() => {
    if (dialogMode === "close") {
      void loadSummary();
    } else {
      setSummary(null);
    }
  }, [dialogMode, loadSummary]);

  // Live difference calculation
  const cashVal = parseFloat(actualCash);
  const liveDiff = summary && !isNaN(cashVal) && cashVal >= 0
    ? cashVal - summary.expectedCash
    : null;

  const handleOpen = async () => {
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) return;
    setSubmitting(true);
    try {
      await onOpen(amount);
      setDialogMode(null);
      setOpeningAmount("");
      posAlert.fire({
        toast: true,
        position: "top-end",
        timer: 2000,
        showConfirmButton: false,
        icon: "success",
        title: t("cashRegister.openedSuccess"),
      });
    } catch (err) {
      handleApiError(err, t);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    const cash = parseFloat(actualCash);
    if (isNaN(cash) || cash < 0) return;
    setSubmitting(true);
    try {
      const result = await onClose(cash, closeNotes.trim() || undefined);
      setDialogMode(null);
      setActualCash("");
      setCloseNotes("");

      const diff = Number(result.difference ?? 0);
      const totalSales = Number(result.totalSales ?? 0);
      const totalCashSales = Number(result.totalCashSales ?? 0);
      const totalDigitalSales = Number(result.totalDigitalSales ?? 0);
      const tickets = Number(result.totalTickets ?? 0);
      const expected = Number(result.expectedCash ?? 0);
      const actual = Number(result.actualCash ?? 0);
      const opening = summary?.openingAmount ?? 0;

      const isExact = diff === 0;
      const isSurplus = diff > 0;
      const verdictColor = isExact ? "var(--primary)" : isSurplus ? "var(--primary)" : "var(--destructive)";
      const verdictLabel = isExact
        ? t("cashRegister.exact")
        : isSurplus
          ? t("cashRegister.surplus")
          : t("cashRegister.deficit");
      const diffDisplay = `${diff > 0 ? "+" : ""}${cs} ${Math.abs(diff).toFixed(2)}`;

      await posAlert.fire({
        icon: isExact || isSurplus ? "success" : "warning",
        title: t("cashRegister.reconciliation"),
        iconColor: verdictColor,
        confirmButtonText: t("cart.done"),
        width: 420,
        html: `
          <div style="text-align:left; font-size:13px; color:var(--muted-foreground); margin-top:8px;">
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid color-mix(in oklch, var(--border) 50%, transparent);">
              <span>${t("cashRegister.openingAmount")}</span>
              <span style="font-weight:700; color:var(--foreground);">${cs} ${opening.toFixed(2)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid color-mix(in oklch, var(--border) 50%, transparent);">
              <span>+ ${t("cashRegister.cashSales")}</span>
              <span style="font-weight:700; color:var(--foreground);">${cs} ${totalCashSales.toFixed(2)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid color-mix(in oklch, var(--border) 50%, transparent);">
              <span>${t("cashRegister.digitalSales")}</span>
              <span style="font-weight:700; color:var(--foreground);">${cs} ${totalDigitalSales.toFixed(2)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid color-mix(in oklch, var(--border) 50%, transparent);">
              <span>${t("cashRegister.totalSales")}</span>
              <span style="font-weight:700; color:var(--foreground);">${cs} ${totalSales.toFixed(2)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid color-mix(in oklch, var(--border) 50%, transparent);">
              <span>${t("cashRegister.tickets")}</span>
              <span style="font-weight:700; color:var(--foreground);">${tickets}</span>
            </div>
            <div style="margin-top:10px; padding:10px 12px; border-radius:12px; background:color-mix(in oklch, var(--muted) 80%, transparent);">
              <div style="display:flex; justify-content:space-between; padding:3px 0;">
                <span>${t("cashRegister.expectedCash")}</span>
                <span style="font-weight:800; color:var(--foreground);">${cs} ${expected.toFixed(2)}</span>
              </div>
              <div style="display:flex; justify-content:space-between; padding:3px 0;">
                <span>${t("cashRegister.actualCash")}</span>
                <span style="font-weight:800; color:var(--foreground);">${cs} ${actual.toFixed(2)}</span>
              </div>
            </div>
            <div style="margin-top:12px; padding:14px; border-radius:14px; border:2px solid ${verdictColor}; background:color-mix(in oklch, ${verdictColor} 8%, transparent); text-align:center;">
              <div style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:${verdictColor};">${verdictLabel}</div>
              <div style="font-size:28px; font-weight:900; color:${verdictColor}; margin-top:4px;">${diffDisplay}</div>
            </div>
          </div>
        `,
      });
    } catch (err) {
      handleApiError(err, t);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  const elapsed = register
    ? Math.floor((Date.now() - new Date(register.openedAt).getTime()) / 60_000)
    : 0;
  const hours = Math.floor(elapsed / 60);
  const mins = elapsed % 60;
  const elapsedStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <>
      {/* ── Compact status bar ── */}
      <button
        type="button"
        onClick={() => setDialogMode(register ? "close" : "open")}
        className={cn(
          "w-full px-4 py-2.5 flex items-center gap-3 border-b transition-colors text-left",
          register
            ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
            : "bg-destructive/5 border-destructive/20 hover:bg-destructive/10",
        )}
      >
        <div className={cn(
          "w-7 h-7 rounded-sm flex items-center justify-center shrink-0",
          register ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive",
        )}>
          {register ? <LockOpen className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-[11px] font-bold uppercase tracking-wider",
            register ? "text-primary" : "text-destructive",
          )}>
            {register ? t("cashRegister.open") : t("cashRegister.closed")}
          </p>
          {register && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {t("cashRegister.since")} {new Date(register.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {elapsedStr}
            </p>
          )}
        </div>
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-wider",
          register ? "text-primary/60" : "text-destructive/60",
        )}>
          {register ? t("cashRegister.closeAction") : t("cashRegister.openAction")}
        </span>
      </button>

      {/* ── Open register dialog ── */}
      <Dialog open={dialogMode === "open"} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent className="sm:max-w-sm rounded-sm border border-border bg-background p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
            <DialogTitle className="text-[15px] font-bold text-foreground flex items-center gap-2">
              <LockOpen className="w-4 h-4 text-primary" />
              {t("cashRegister.openTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="px-5 py-5 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {t("cashRegister.openingAmount")}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input
                  autoFocus
                  type="number"
                  min="0"
                  step="0.01"
                  value={openingAmount}
                  onChange={(e) => setOpeningAmount(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleOpen()}
                  placeholder="0.00"
                  className="h-12 pl-10 rounded-sm bg-muted/40 border-border text-lg font-bold tabular-nums"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-5 pb-5 pt-0 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-sm text-sm"
              onClick={() => setDialogMode(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              disabled={!openingAmount || parseFloat(openingAmount) < 0 || submitting}
              onClick={handleOpen}
              className="flex-1 h-11 rounded-sm bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm gap-2"
            >
              <LockOpen className="w-4 h-4" />
              {t("cashRegister.openAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Close register dialog — full cuadre de caja ── */}
      <Dialog open={dialogMode === "close"} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent className="sm:max-w-[420px] rounded-sm border border-border bg-background p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
            <DialogTitle className="text-[15px] font-bold text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-destructive" />
              {t("cashRegister.closeTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="px-5 py-5 space-y-4">
            {/* Live sales breakdown */}
            {summaryLoading ? (
              <div className="bg-muted/40 rounded-sm px-4 py-6 text-center">
                <p className="text-xs text-muted-foreground animate-pulse">{t("common.loading")}...</p>
              </div>
            ) : summary ? (
              <div className="bg-muted/40 rounded-sm px-4 py-3 space-y-0">
                <StatRow
                  icon={<DollarSign className="w-3.5 h-3.5" />}
                  label={t("cashRegister.openingAmount")}
                  value={`${cs} ${summary.openingAmount.toFixed(2)}`}
                />
                <Divider />
                <StatRow
                  icon={<Banknote className="w-3.5 h-3.5" />}
                  label={t("cashRegister.cashSales")}
                  value={`${cs} ${summary.totalCashSales.toFixed(2)}`}
                  highlight
                />
                <StatRow
                  icon={<CreditCard className="w-3.5 h-3.5" />}
                  label={t("cashRegister.digitalSales")}
                  value={`${cs} ${summary.totalDigitalSales.toFixed(2)}`}
                />
                <StatRow
                  icon={<TrendingUp className="w-3.5 h-3.5" />}
                  label={t("cashRegister.totalSales")}
                  value={`${cs} ${summary.totalSales.toFixed(2)}`}
                  highlight
                />
                <Divider />
                <StatRow
                  icon={<Receipt className="w-3.5 h-3.5" />}
                  label={t("cashRegister.tickets")}
                  value={`${summary.totalTickets}`}
                />
                <StatRow
                  icon={<Clock className="w-3.5 h-3.5" />}
                  label={t("cashRegister.duration")}
                  value={elapsedStr}
                />
                <Divider />
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-[13px] font-bold text-foreground">
                    <ArrowRight className="w-3.5 h-3.5" />
                    {t("cashRegister.expectedCash")}
                  </div>
                  <span className="text-base font-black tabular-nums text-primary">
                    {cs} {summary.expectedCash.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : register ? (
              <div className="bg-muted/40 rounded-sm px-4 py-3">
                <StatRow
                  icon={<DollarSign className="w-3.5 h-3.5" />}
                  label={t("cashRegister.openingAmount")}
                  value={`${cs} ${register.openingAmount.toFixed(2)}`}
                />
                <StatRow
                  icon={<Clock className="w-3.5 h-3.5" />}
                  label={t("cashRegister.duration")}
                  value={elapsedStr}
                />
              </div>
            ) : null}

            {/* Actual cash input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {t("cashRegister.actualCash")}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input
                  autoFocus
                  type="number"
                  min="0"
                  step="0.01"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  placeholder="0.00"
                  className="h-12 pl-10 rounded-sm bg-muted/40 border-border text-lg font-bold tabular-nums"
                />
              </div>
            </div>

            {/* Live difference preview */}
            {liveDiff !== null && (
              <div className={cn(
                "flex items-center justify-between px-4 py-3 rounded-sm border-2 transition-colors",
                liveDiff === 0
                  ? "border-primary/30 bg-primary/5"
                  : liveDiff > 0
                    ? "border-primary/30 bg-primary/5"
                    : "border-destructive/30 bg-destructive/5",
              )}>
                <div className="flex items-center gap-2">
                  {liveDiff === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : liveDiff > 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  )}
                  <span className={cn(
                    "text-[11px] font-bold uppercase tracking-wider",
                    liveDiff >= 0 ? "text-primary" : "text-destructive",
                  )}>
                    {liveDiff === 0
                      ? t("cashRegister.exact")
                      : liveDiff > 0
                        ? t("cashRegister.surplus")
                        : t("cashRegister.deficit")}
                  </span>
                </div>
                <span className={cn(
                  "text-lg font-black tabular-nums",
                  liveDiff >= 0 ? "text-primary" : "text-destructive",
                )}>
                  {liveDiff > 0 ? "+" : ""}{cs} {Math.abs(liveDiff).toFixed(2)}
                </span>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {t("cashRegister.notes")}
              </label>
              <Input
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleClose()}
                placeholder={t("cashRegister.notesPlaceholder")}
                className="h-10 rounded-sm bg-muted/40 border-border text-sm"
              />
            </div>
          </div>

          <DialogFooter className="px-5 pb-5 pt-0 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-sm text-sm"
              onClick={() => setDialogMode(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              disabled={!actualCash || parseFloat(actualCash) < 0 || submitting}
              onClick={handleClose}
              variant="destructive"
              className="flex-1 h-11 rounded-sm font-bold text-sm gap-2"
            >
              <Lock className="w-4 h-4" />
              {t("cashRegister.closeAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
