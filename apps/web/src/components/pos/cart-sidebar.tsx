"use client";

import { cn } from "@/lib/utils";
import { Pencil, Trash2, ShoppingBag, Minus, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCart } from "@/hooks/useCart";
import { useState } from "react";
import { posAlert } from "@/lib/sweetalert";
import { useTranslation } from "@/i18n";
import { PaymentDialog } from "./payment-dialog";
import { apiFetch, ApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import type { CreateOrderResult } from "./types";
import { getStatusBorder } from "./table-utils";
import { TableBoardDialog } from "./table-board-dialog";
import { useTableManagement, errorKeyByCode } from "./use-table-management";
import { CashRegisterBar } from "./cash-register-bar";
import { useCashRegister } from "@/hooks/useCashRegister";

export function CartSidebar() {
  const { items, getTotals, removeItem, updateQuantity, clearCart } = useCart();
  const updateNotes = useCart((s) => s.updateNotes);
  const { subtotal, tax, total } = getTotals();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEOUT">("DINE_IN");
  const [customerName, setCustomerName] = useState("");
  const { t, locale } = useTranslation();

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteDialogItemId, setNoteDialogItemId] = useState<string | null>(null);
  const [noteDialogValue, setNoteDialogValue] = useState("");

  const [userRole] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem("pos_user");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { role?: unknown };
      const role = parsed?.role ? String(parsed.role) : "";
      return role ? role.toUpperCase() : null;
    } catch {
      return null;
    }
  });
  const isAdmin = userRole === "ADMIN";

  const tm = useTableManagement(orderType, isAdmin);
  const cr = useCashRegister();

  const openNoteDialog = (itemId: string, currentNote: string | null) => {
    setNoteDialogItemId(itemId);
    setNoteDialogValue(currentNote ?? "");
    setNoteDialogOpen(true);
  };

  const saveNote = () => {
    if (!noteDialogItemId) return;
    const trimmed = noteDialogValue.trim();
    updateNotes(noteDialogItemId, trimmed || null);
    setNoteDialogOpen(false);
  };

  const handleCheckout = async (paymentDetails: {
    paymentMethod: string;
    cashReceived?: number;
    referenceNumber?: string;
  }) => {
    if (items.length === 0) return;
    setIsSubmitting(true);

    try {
      if (!cr.register) {
        await posAlert.fire({
          icon: "warning",
          title: t("cashRegister.requiredTitle"),
          text: t("cashRegister.requiredText"),
          confirmButtonText: t("cashRegister.openAction"),
        });
        setIsSubmitting(false);
        return;
      }

      if (orderType === "DINE_IN" && !tm.tableId) {
        tm.setTableTouched(true);
        throw new Error("TABLE_REQUIRED");
      }

      const payload = {
        orderType,
        tableId: orderType === "DINE_IN" ? tm.tableId : null,
        customerName: orderType === "TAKEOUT" ? customerName.trim() || null : null,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || null,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          variantName: item.variantName,
          notes: item.notes,
          modifiers: item.modifiers ?? [],
        })),
        ...paymentDetails,
      };

      const result = await apiFetch<CreateOrderResult>("/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      clearCart();
      setIsPaymentDialogOpen(false);

      try {
        window.open(
          `/print/ticket/${encodeURIComponent(result.ticketNumber)}?origin=${encodeURIComponent(
            window.location.origin,
          )}&lang=${encodeURIComponent(locale)}`,
          "_blank",
          "noopener,noreferrer,width=480,height=720",
        );
      } catch {
        // ignore
      }

      const changeAmount = Number(result.payment?.changeAmount || 0);
      const hasChange = changeAmount > 0;

      await posAlert.fire({
        icon: "success",
        title: t("cart.orderPlaced"),
        iconColor: "var(--primary)",
        confirmButtonText: t("cart.done"),
        showCancelButton: false,
        timer: hasChange ? 6000 : 3500,
        timerProgressBar: true,
        html: `
          <div style="text-align:center;">
            <div style="font-weight:700; color:var(--muted-foreground); font-size:10px; text-transform:uppercase; letter-spacing:0.07em;">${t("cart.ticketLabel")}</div>
            <div style="font-weight:900; color:var(--primary); font-size:22px; letter-spacing:-0.03em; margin-top:4px; line-height:1;">${result.ticketNumber}</div>
            <div style="margin-top:8px; font-size:12px; color:var(--muted-foreground); font-weight:500;">${t("cart.sentToKitchen")}</div>
            ${
              hasChange
                ? `<div style="margin-top:16px; padding:14px 16px; border-radius:14px; border:1px solid var(--primary); background:color-mix(in oklch, var(--primary) 8%, transparent);">
                    <div style="font-weight:800; color:var(--primary); font-size:10px; text-transform:uppercase; letter-spacing:0.08em;">${t("cart.changeToGive")}</div>
                    <div style="font-weight:900; color:var(--primary); font-size:28px; margin-top:4px; line-height:1;">S/ ${changeAmount.toFixed(2)}</div>
                  </div>`
                : ""
            }
          </div>
        `,
      });
    } catch (error: unknown) {
      const code =
        error instanceof ApiError
          ? error.code
          : error instanceof Error
            ? error.message
            : null;

      if (!Object.prototype.hasOwnProperty.call(errorKeyByCode, code ?? "")) {
        console.error("Order submission failed", error);
      }
      const message =
        code && Object.prototype.hasOwnProperty.call(errorKeyByCode, code)
          ? t(errorKeyByCode[code as keyof typeof errorKeyByCode])
          : t("errors.generic");

      await posAlert.fire({
        icon: "error",
        title: t("cart.checkoutFailed"),
        text: message || t("cart.checkoutFailedText"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="w-full lg:w-95 h-full min-h-0 bg-sidebar border-l border-sidebar-border flex flex-col relative z-10 shrink-0">
      {/* ── Cash Register Status ── */}
      <CashRegisterBar
        register={cr.register}
        loading={cr.loading}
        onOpen={cr.openRegister}
        onClose={cr.closeRegister}
        onFetchSummary={cr.fetchSummary}
      />

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4 border-b border-sidebar-border flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold tracking-tight text-foreground">
            {t("cart.currentOrder")}
          </h2>
          {items.length > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary leading-none">
              {items.reduce((acc, i) => acc + i.quantity, 0)}
            </span>
          )}
        </div>

        {/* Segmented control */}
        <div className="flex bg-muted/60 rounded-xl p-0.5 gap-0.5">
          <button
            type="button"
            onClick={() => {
              setOrderType("DINE_IN");
              setCustomerName("");
              tm.setTableTouched(false);
            }}
            className={cn(
              "flex-1 h-8 rounded-[10px] text-xs font-semibold uppercase tracking-wide transition-all",
              orderType === "DINE_IN"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("cart.dineIn")}
          </button>
          <button
            type="button"
            onClick={() => {
              setOrderType("TAKEOUT");
              tm.setTableId(null);
              tm.setTableTouched(false);
            }}
            className={cn(
              "flex-1 h-8 rounded-[10px] text-xs font-semibold uppercase tracking-wide transition-all",
              orderType === "TAKEOUT"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("cart.takeout")}
          </button>
        </div>

        {/* Table selector */}
        {orderType === "DINE_IN" && (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={tm.openTableDialog}
              className={cn(
                "w-full px-3.5 py-2.5 rounded-xl border bg-background/60 flex items-center gap-3 transition-colors",
                tm.tableTouched && !tm.tableId
                  ? "border-destructive/50 bg-destructive/5"
                  : tm.selectedTable
                    ? cn(getStatusBorder(tm.selectedTable.status), "hover:bg-accent/40")
                    : "border-border hover:bg-accent/40",
              )}
            >
              {tm.selectedTable ? (
                <>
                  <span
                    className={cn(
                      "w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0",
                      getStatusBorder(tm.selectedTable.status),
                    )}
                  >
                    <span className="text-xs font-black text-foreground">
                      {tm.selectedTable.number}
                    </span>
                  </span>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="font-semibold text-sm text-foreground">
                      {t("cart.table")} {tm.selectedTable.number}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {tm.selectedTable.zone || ""}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-muted-foreground text-left">
                    {t("tables.selectTable")}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                </>
              )}
            </button>
            {tm.tableTouched && !tm.tableId && (
              <p className="text-xs text-destructive ml-1">
                {t("errors.TABLE_REQUIRED")}
              </p>
            )}
          </div>
        )}

        {/* Customer name for takeout */}
        {orderType === "TAKEOUT" && (
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder={t("cart.customerNamePlaceholder")}
            className="h-10 rounded-xl bg-background/60 border-border"
          />
        )}
      </div>

      {/* ── Cart items ── */}
      <ScrollArea className="flex-1 px-4 bg-sidebar">
        <div className="py-4 space-y-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center">
                <ShoppingBag className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <p className="font-semibold text-foreground text-sm">
                {t("cart.noItemSelected")}
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-background/60 border border-border/60 rounded-xl px-3.5 py-3 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground leading-tight">
                      {item.name}
                    </p>
                    {item.variantName && (
                      <span className="text-[11px] text-muted-foreground">
                        {item.variantName}
                      </span>
                    )}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        + {item.modifiers.map((m) => m.name).join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-bold text-sm text-primary">
                      S/{((item.price + (item.modifiersCost || 0)) * item.quantity).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        item.quantity <= 1
                          ? removeItem(item.id)
                          : updateQuantity(item.id, item.quantity - 1)
                      }
                      className="w-7 h-7 rounded-lg border border-border bg-muted/40 hover:bg-accent flex items-center justify-center transition-colors"
                      aria-label={t("cart.decrease")}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-foreground w-5 text-center text-sm tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg border border-border bg-muted/40 hover:bg-accent flex items-center justify-center transition-colors"
                      aria-label={t("cart.increase")}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => openNoteDialog(item.id, item.notes ?? null)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    {item.notes ? t("cart.edit") : t("cart.add")} {t("cart.note").toLowerCase()}
                  </button>
                </div>

                {item.notes && (
                  <div className="text-[11px] font-medium text-destructive bg-destructive/5 border border-destructive/15 rounded-lg px-2.5 py-1.5 leading-snug">
                    {item.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* ── Footer totals + CTA ── */}
      <div className="border-t border-sidebar-border px-5 pt-4 pb-5 space-y-3 bg-sidebar">
        <div className="space-y-2">
          <div className="flex justify-between text-[13px] text-muted-foreground">
            <span>{t("cart.items")}</span>
            <span className="text-foreground font-medium">{items.length}</span>
          </div>
          <div className="flex justify-between text-[13px] text-muted-foreground">
            <span>{t("cart.subtotal")}</span>
            <span className="text-foreground font-medium">S/{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[13px] text-muted-foreground">
            <span>{t("cart.discount")}</span>
            <span className="font-medium text-primary">- S/0.00</span>
          </div>
          <div className="flex justify-between text-[13px] text-muted-foreground">
            <span>{t("cart.tax")} (18%)</span>
            <span className="text-foreground font-medium">S/{tax.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-border/60">
          <span className="text-sm font-bold text-foreground uppercase tracking-wide">
            {t("cart.total")}
          </span>
          <span className="text-2xl font-black text-primary tracking-tight">
            S/{total.toFixed(2)}
          </span>
        </div>

        <Button
          onClick={() => setIsPaymentDialogOpen(true)}
          disabled={items.length === 0 || isSubmitting}
          className="h-12 w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {t("cart.placeOrder")}
        </Button>
      </div>

      {/* ── Note Dialog ── */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl border border-border bg-sidebar p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
            <DialogTitle className="text-[15px] font-bold text-foreground">
              {t("cart.itemNoteTitle")}
            </DialogTitle>
            {noteDialogItemId && (() => {
              const item = items.find(i => i.id === noteDialogItemId);
              return item ? (
                <p className="text-[13px] text-muted-foreground mt-0.5">{item.name}</p>
              ) : null;
            })()}
          </DialogHeader>

          <div className="px-5 py-4">
            <Input
              autoFocus
              value={noteDialogValue}
              onChange={(e) => setNoteDialogValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveNote()}
              placeholder={t("cart.itemNotePlaceholder")}
              className="h-10 rounded-xl bg-background/60 border-border text-sm"
            />
          </div>

          <DialogFooter className="px-5 pb-5 pt-0 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-10 rounded-xl text-sm"
              onClick={() => setNoteDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm"
              onClick={saveNote}
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        items={items}
        subtotal={subtotal}
        tax={tax}
        totalAmount={total}
        onConfirm={handleCheckout}
        isSubmitting={isSubmitting}
      />

      <TableBoardDialog
        isOpen={tm.isTableDialogOpen}
        onOpenChange={(open) => {
          tm.setIsTableDialogOpen(open);
          if (open) {
            tm.openTableDialog();
          }
        }}
        tables={tm.tables}
        filteredTables={tm.filteredTables}
        zoneOptions={tm.zoneOptions}
        zoneFilter={tm.zoneFilter}
        onZoneFilterChange={tm.setZoneFilter}
        statusFilter={tm.statusFilter}
        onStatusFilterChange={tm.setStatusFilter}
        tablesLoading={tm.tablesLoading}
        activeOrdersLoading={tm.activeOrdersLoading}
        dialogTableId={tm.dialogTableId}
        onDialogTableIdChange={tm.setDialogTableId}
        dialogSelectedTable={tm.dialogSelectedTable}
        activeOrdersByTableId={tm.activeOrdersByTableId}
        onRefresh={tm.refreshTables}
        onConfirmSelect={tm.handleSelectTableFromDialog}
        onReleaseTable={tm.handleReleaseTable}
      />
    </aside>
  );
}
