"use client";

import { Pencil, Trash2, ShoppingBag, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/hooks/useCart";
import { useEffect, useMemo, useState } from "react";
import { posAlert } from "@/lib/sweetalert";
import { useTranslation } from "@/i18n";
import { PaymentDialog } from "./payment-dialog";
import { apiFetch, ApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import QRCode from "qrcode";
import Swal from "sweetalert2";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}

type Table = {
  id: string;
  number: number;
  capacity: number;
  zone?: string | null;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | (string & {});
};

type CreateOrderResult = {
  ticketNumber: string;
  payment?: { changeAmount?: number } | null;
};

export function CartSidebar() {
  const { items, getTotals, removeItem, updateQuantity, clearCart } = useCart();
  const updateNotes = useCart((s) => s.updateNotes);
  const tableId = useCart((s) => s.tableId);
  const setTableId = useCart((s) => s.setTableId);
  const { subtotal, tax, total } = getTotals();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEOUT">("DINE_IN");
  const [customerName, setCustomerName] = useState("");
  const { t, locale } = useTranslation();

  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [tableTouched, setTableTouched] = useState(false);

  const errorKeyByCode = {
    ORDER_NOT_FOUND: "errors.ORDER_NOT_FOUND",
    ORDER_ITEMS_REQUIRED: "errors.ORDER_ITEMS_REQUIRED",
    TABLE_REQUIRED: "errors.TABLE_REQUIRED",
    TABLE_INVALID: "errors.TABLE_INVALID",
    TABLE_NOT_FOUND: "errors.TABLE_NOT_FOUND",
    ORDER_CREATE_FAILED: "errors.ORDER_CREATE_FAILED",
    ORDER_CANNOT_CANCEL_DELIVERED: "errors.ORDER_CANNOT_CANCEL_DELIVERED",
    PAYMENT_METHOD_UNSUPPORTED: "errors.PAYMENT_METHOD_UNSUPPORTED",
    CASH_RECEIVED_REQUIRED: "errors.CASH_RECEIVED_REQUIRED",
    CASH_INSUFFICIENT: "errors.CASH_INSUFFICIENT",
    REFERENCE_REQUIRED: "errors.REFERENCE_REQUIRED",
  } as const;

  const selectedTable = useMemo(() => {
    if (!tableId) return null;
    return tables.find((t) => t.id === tableId) || null;
  }, [tableId, tables]);

  const tablesByZone = useMemo(() => {
    const map = new Map<string, Table[]>();
    for (const tb of tables) {
      const key = (tb.zone || "").trim() || t("tables.noZone");
      const arr = map.get(key) || [];
      arr.push(tb);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], undefined, { sensitivity: "base" }),
    );
  }, [tables, t]);

  const getTableStatusLabel = (status: string) => {
    const s = String(status || "").toUpperCase();
    if (s === "AVAILABLE") return t("tables.statusAvailable");
    if (s === "OCCUPIED") return t("tables.statusOccupied");
    if (s === "RESERVED") return t("tables.statusReserved");
    return s;
  };

  const isTableSelectable = (status: string) =>
    String(status || "").toUpperCase() === "AVAILABLE";

  const loadTables = async () => {
    setTablesLoading(true);
    try {
      const data = await apiFetch<Table[]>("/tables");
      setTables(Array.isArray(data) ? data : []);
    } catch {
      setTables([]);
    } finally {
      setTablesLoading(false);
    }
  };

  useEffect(() => {
    if (orderType !== "DINE_IN") return;
    if (tables.length > 0) return;
    void loadTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderType]);

  const handleCheckout = async (paymentDetails: {
    paymentMethod: string;
    cashReceived?: number;
    referenceNumber?: string;
  }) => {
    if (items.length === 0) return;
    setIsSubmitting(true);

    try {
      if (orderType === "DINE_IN" && !tableId) {
        setTableTouched(true);
        throw new Error("TABLE_REQUIRED");
      }

      const payload = {
        orderType,
        tableId: orderType === "DINE_IN" ? tableId : null,
        customerName:
          orderType === "TAKEOUT" ? customerName.trim() || null : null,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || null,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          variantName: item.variantName,
          notes: item.notes,
        })),
        ...paymentDetails,
      };

      const result = await apiFetch<CreateOrderResult>("/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      clearCart();
      setIsPaymentDialogOpen(false);

      const trackingUrl = `${window.location.origin}/tracking/${encodeURIComponent(
        result.ticketNumber,
      )}?lang=${encodeURIComponent(locale)}`;

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

      let qrDataUrl: string | null = null;
      try {
        qrDataUrl = await QRCode.toDataURL(trackingUrl, {
          width: 220,
          margin: 1,
          errorCorrectionLevel: "M",
        });
      } catch {
        qrDataUrl = null;
      }

      const changeAmount = Number(result.payment?.changeAmount || 0);

      const modal = await posAlert.fire({
        icon: "success",
        title: t("cart.orderPlaced"),
        iconColor: "#00BFA6",
        confirmButtonText: t("cart.openTracking"),
        showCancelButton: true,
        cancelButtonText: t("cart.copyLink"),
        html: `
          <div style="text-align:left;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:16px; margin-top:8px;">
              <div>
                <div style="font-weight:800; color:#111827; font-size:13px;">${t("cart.ticketLabel")}</div>
                <div style="font-weight:900; color:#00BFA6; font-size:22px; letter-spacing:-0.02em;">${result.ticketNumber}</div>
                <div style="margin-top:6px; font-size:12px; color:#6b7280; font-weight:600;">${t("cart.scanQrOrOpenLink")}</div>
              </div>
              ${
                qrDataUrl
                  ? `<img src="${qrDataUrl}" alt="${t("cart.qrAlt")}" style="width:140px; height:140px; border-radius:16px; border:1px solid rgba(0,0,0,0.06); background:#fff;" />`
                  : ""
              }
            </div>

            <div style="margin-top:14px; padding:10px 12px; border:1px solid rgba(0,0,0,0.06); border-radius:14px; background:#f9fafb; font-size:12px; color:#111827; word-break:break-all;">
              ${trackingUrl}
            </div>

              ${
                changeAmount > 0
                  ? `<div style="margin-top:14px; padding:12px 14px; border-radius:14px; border:1px dashed rgba(239,68,68,0.35); background:rgba(239,68,68,0.06);">
                    <div style="font-weight:900; color:#991b1b; font-size:12px; text-transform:uppercase; letter-spacing:0.08em;">${t("cart.changeToGive")}</div>
                    <div style="font-weight:900; color:#b91c1c; font-size:26px; margin-top:4px;">S/ ${changeAmount.toFixed(2)}</div>
                  </div>`
                  : ""
              }
          </div>
        `,
      });

      if (modal.isConfirmed) {
        window.open(trackingUrl, "_blank", "noopener,noreferrer");
      } else if (modal.dismiss === Swal.DismissReason.cancel) {
        const ok = await copyToClipboard(trackingUrl);
        posAlert.fire({
          toast: true,
          position: "top-end",
          timer: 1800,
          showConfirmButton: false,
          icon: ok ? "success" : "error",
          title: ok ? t("cart.linkCopied") : t("cart.linkCopyFailed"),
        });
      }
    } catch (error: unknown) {
      console.error("Order submission failed", error);

      const code =
        error instanceof ApiError
          ? error.code
          : error instanceof Error
            ? error.message
            : null;
      const message =
        code && Object.prototype.hasOwnProperty.call(errorKeyByCode, code)
          ? t(errorKeyByCode[code as keyof typeof errorKeyByCode])
          : t("errors.generic");

      await posAlert.fire({
        icon: "error",
        title: t("cart.checkoutFailed"),
        text: message || t("cart.checkoutFailedText"),
        confirmButtonColor: "#ff5757",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="w-full lg:w-[380px] h-full min-h-0 bg-background border-l border-border flex flex-col relative z-10 transition-all duration-500 shrink-0">
      {/* Header Info */}
      <div className="p-6 pb-4 border-b border-border/50 flex flex-col gap-4 bg-card text-card-foreground">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">
            {t("cart.currentOrder")}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setOrderType("DINE_IN");
              setCustomerName("");
              setTableTouched(false);
            }}
            className={`h-10 rounded-xl border text-xs font-black uppercase tracking-wider transition-colors ${
              orderType === "DINE_IN"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-accent/60"
            }`}
          >
            {t("cart.dineIn")}
          </button>
          <button
            type="button"
            onClick={() => {
              setOrderType("TAKEOUT");
              setTableId(null);
              setTableTouched(false);
            }}
            className={`h-10 rounded-xl border text-xs font-black uppercase tracking-wider transition-colors ${
              orderType === "TAKEOUT"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-accent/60"
            }`}
          >
            {t("cart.takeout")}
          </button>
        </div>

        {orderType === "DINE_IN" && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground ml-1">
              {t("cart.table")}
            </label>
            <button
              type="button"
              onClick={() => {
                setIsTableDialogOpen(true);
                if (!tablesLoading && tables.length === 0) void loadTables();
              }}
              className={`w-full h-11 px-4 rounded-xl border bg-background flex items-center justify-between gap-3 transition-colors ${
                tableTouched && !tableId
                  ? "border-destructive/50 bg-destructive/5"
                  : "border-border hover:bg-accent/40"
              }`}
            >
              <span className="font-black text-sm text-foreground">
                {selectedTable
                  ? `${t("cart.table")} ${selectedTable.number}`
                  : t("tables.selectTable")}
              </span>
              <span className="text-xs font-bold text-muted-foreground truncate">
                {selectedTable?.zone || ""}
              </span>
            </button>

            {tableTouched && !tableId && (
              <p className="text-xs font-semibold text-destructive">
                {t("errors.TABLE_REQUIRED")}
              </p>
            )}
          </div>
        )}

        {orderType === "TAKEOUT" && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground ml-1">
              {t("cart.customerNameOptional")}
            </label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t("cart.customerNamePlaceholder")}
              className="h-11 bg-background border-border rounded-xl font-semibold"
            />
          </div>
        )}
      </div>

      {/* Cart Items List */}
      <ScrollArea className="flex-1 px-6 pb-4 bg-card">
        <div className="space-y-6 pt-6 flex flex-col h-full">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground flex flex-col items-center gap-3 py-16 m-auto">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-2">
                <ShoppingBag className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="font-semibold text-foreground text-base">
                {t("cart.noItemSelected")}
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-1.5 group relative"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-foreground leading-tight text-sm pr-4">
                    {item.name}
                  </h4>
                  <span className="font-bold text-primary text-sm whitespace-nowrap">
                    S/{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("cart.note")}</span>
                  <button
                    type="button"
                    onClick={async () => {
                      const modal = await posAlert.fire({
                        title: t("cart.itemNoteTitle"),
                        text: item.name,
                        input: "text",
                        inputValue: item.notes || "",
                        inputPlaceholder: t("cart.itemNotePlaceholder"),
                        showCancelButton: true,
                        confirmButtonText: t("common.save"),
                        cancelButtonText: t("common.cancel"),
                      });

                      if (!modal.isConfirmed) return;
                      const value =
                        typeof modal.value === "string" ? modal.value : "";
                      updateNotes(item.id, value.trim() ? value.trim() : null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {item.notes ? t("cart.edit") : t("cart.add")}
                  </button>
                </div>

                {item.notes && (
                  <div className="text-[12px] font-bold text-red-600 bg-red-500/5 border border-red-500/10 rounded-2xl px-3 py-2">
                    {item.notes}
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{t("cart.quantity")}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        item.quantity <= 1
                          ? removeItem(item.id)
                          : updateQuantity(item.id, item.quantity - 1)
                      }
                      className="w-8 h-8 rounded-full border border-border bg-background hover:bg-accent/50 transition-colors flex items-center justify-center"
                      aria-label={t("cart.decrease")}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-black text-foreground w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full border border-border bg-background hover:bg-accent/50 transition-colors flex items-center justify-center"
                      aria-label={t("cart.increase")}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{t("cart.variant")}</span>
                  <span className="font-medium text-foreground">
                    {item.variantName || t("cart.regular")}
                  </span>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute -left-4 top-0 bottom-0 flex items-center justify-center text-muted-foreground/50 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5 -ml-2" />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Checkout Section Footer */}
      <div className="bg-card px-6 pb-6 pt-4 border-t border-border/50 space-y-4 mt-auto z-20">
        <div className="space-y-3">
          <div className="flex justify-between text-[13px] text-muted-foreground">
            <span>{t("cart.items")}</span>
            <span className="text-foreground font-medium">{items.length}</span>
          </div>
          <div className="flex justify-between text-[13px] text-muted-foreground">
            <span>{t("cart.subtotal")}</span>
            <span className="text-foreground font-medium">
              S/{subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-[13px] text-muted-foreground">
            <span>{t("cart.discount")}</span>
            <span className="text-primary font-medium">- S/0.00</span>
          </div>
          <div className="flex justify-between text-[13px] text-muted-foreground">
            <span>{t("cart.tax")} (18%)</span>
            <span className="text-foreground font-medium">
              S/{tax.toFixed(2)}
            </span>
          </div>

          <div className="pt-4 mt-2 flex justify-between items-center">
            <span className="text-sm font-bold text-foreground uppercase">
              {t("cart.total")}
            </span>
            <span className="text-2xl font-black text-primary tracking-tight">
              S/{total.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => setIsPaymentDialogOpen(true)}
            disabled={items.length === 0 || isSubmitting}
            className="h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm w-full rounded-full transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {t("cart.placeOrder")}
          </Button>
        </div>
      </div>

      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        totalAmount={total}
        onConfirm={handleCheckout}
        isSubmitting={isSubmitting}
      />

      <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="font-black tracking-tight">
              {t("tables.title")}
            </DialogTitle>
            <DialogDescription>
              {orderType === "DINE_IN" ? t("cart.dineIn") : t("cart.takeout")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-bold text-muted-foreground">
              {tablesLoading ? t("tables.loading") : ""}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadTables()}
              disabled={tablesLoading}
            >
              {t("common.refresh")}
            </Button>
          </div>

          {tables.length === 0 && !tablesLoading ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm font-semibold text-muted-foreground">
              {t("tables.empty")}
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-auto pr-1">
              <div className="space-y-5">
                {tablesByZone.map(([zone, zoneTables]) => (
                  <div key={zone}>
                    <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">
                      {zone}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {zoneTables.map((tb) => {
                        const selectable = isTableSelectable(tb.status);
                        const status = String(tb.status || "").toUpperCase();
                        const tone =
                          status === "AVAILABLE"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                            : status === "RESERVED"
                              ? "border-amber-200 bg-amber-50 text-amber-900"
                              : "border-red-200 bg-red-50 text-red-900";

                        return (
                          <button
                            key={tb.id}
                            type="button"
                            disabled={!selectable}
                            onClick={() => {
                              setTableId(tb.id);
                              setTableTouched(false);
                              setIsTableDialogOpen(false);
                            }}
                            className={`rounded-xl border p-3 text-left transition-colors ${tone} ${
                              selectable
                                ? "hover:brightness-[0.98]"
                                : "opacity-60 cursor-not-allowed"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-black text-sm">
                                {t("cart.table")} {tb.number}
                              </div>
                              <div className="text-[11px] font-black uppercase tracking-widest">
                                {getTableStatusLabel(tb.status)}
                              </div>
                            </div>

                            <div className="mt-1 text-xs font-semibold opacity-80">
                              {tb.capacity
                                ? `${t("tables.capacity")}: ${tb.capacity}`
                                : ""}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </aside>
  );
}
