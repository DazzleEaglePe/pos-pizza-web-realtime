"use client";

import {
  Pencil,
  Clock,
  CheckCircle2,
  ReceiptText,
  Trash2,
  ShoppingBag,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/hooks/useCart";
import { useState } from "react";
import { posAlert } from "@/lib/sweetalert";
import { useTranslation } from "@/i18n";
import { PaymentDialog } from "./payment-dialog";
import { API_URL } from "@/lib/config";
import { Input } from "@/components/ui/input";
import QRCode from "qrcode";
import Swal from "sweetalert2";

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

export function CartSidebar() {
  const { items, getTotals, removeItem, updateQuantity, clearCart } = useCart();
  const updateNotes = useCart((s) => s.updateNotes);
  const { subtotal, tax, total } = getTotals();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEOUT">("DINE_IN");
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const { t } = useTranslation();

  const handleCheckout = async (paymentDetails: {
    paymentMethod: string;
    cashReceived?: number;
    referenceNumber?: string;
  }) => {
    if (items.length === 0) return;
    setIsSubmitting(true);

    try {
      const payload = {
        orderType,
        tableId: null,
        tableNumber:
          orderType === "DINE_IN" && tableNumber.trim()
            ? Number(tableNumber)
            : undefined,
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

      const token = localStorage.getItem("pos_access_token");

      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = "No se pudo crear el pedido";
        try {
          const data = await response.json();
          message = data?.message || message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      const result = await response.json();

      clearCart();
      setIsPaymentDialogOpen(false);

      const trackingUrl = `${window.location.origin}/tracking/${encodeURIComponent(
        result.ticketNumber,
      )}`;

      try {
        window.open(
          `/print/ticket/${encodeURIComponent(result.ticketNumber)}?origin=${encodeURIComponent(
            window.location.origin,
          )}`,
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
        confirmButtonText: "Abrir seguimiento",
        showCancelButton: true,
        cancelButtonText: "Copiar link",
        html: `
          <div style="text-align:left;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:16px; margin-top:8px;">
              <div>
                <div style="font-weight:800; color:#111827; font-size:13px;">Ticket</div>
                <div style="font-weight:900; color:#00BFA6; font-size:22px; letter-spacing:-0.02em;">${result.ticketNumber}</div>
                <div style="margin-top:6px; font-size:12px; color:#6b7280; font-weight:600;">Escanea el QR o abre el link.</div>
              </div>
              ${
                qrDataUrl
                  ? `<img src="${qrDataUrl}" alt="QR de seguimiento" style="width:140px; height:140px; border-radius:16px; border:1px solid rgba(0,0,0,0.06); background:#fff;" />`
                  : ""
              }
            </div>

            <div style="margin-top:14px; padding:10px 12px; border:1px solid rgba(0,0,0,0.06); border-radius:14px; background:#f9fafb; font-size:12px; color:#111827; word-break:break-all;">
              ${trackingUrl}
            </div>

            ${
              changeAmount > 0
                ? `<div style="margin-top:14px; padding:12px 14px; border-radius:14px; border:1px dashed rgba(239,68,68,0.35); background:rgba(239,68,68,0.06);">
                    <div style="font-weight:900; color:#991b1b; font-size:12px; text-transform:uppercase; letter-spacing:0.08em;">Vuelto a entregar</div>
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
          title: ok ? "Link copiado" : "No se pudo copiar",
        });
      }
    } catch (error: any) {
      console.error("Order submission failed", error);
      await posAlert.fire({
        icon: "error",
        title: t("cart.checkoutFailed"),
        text: error?.message || t("cart.checkoutFailedText"),
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
            }}
            className={`h-10 rounded-xl border text-xs font-black uppercase tracking-wider transition-colors ${
              orderType === "DINE_IN"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-accent/60"
            }`}
          >
            Salón
          </button>
          <button
            type="button"
            onClick={() => {
              setOrderType("TAKEOUT");
              setTableNumber("");
            }}
            className={`h-10 rounded-xl border text-xs font-black uppercase tracking-wider transition-colors ${
              orderType === "TAKEOUT"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-accent/60"
            }`}
          >
            Para llevar
          </button>
        </div>

        {orderType === "DINE_IN" && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground ml-1">
              Mesa (opcional)
            </label>
            <Input
              type="number"
              min={1}
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Ej: 3"
              inputMode="numeric"
              className="h-11 bg-background border-border rounded-xl font-semibold"
            />
          </div>
        )}

        {orderType === "TAKEOUT" && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground ml-1">
              Nombre del cliente (opcional)
            </label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ej: Juan"
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
                  <span>Nota</span>
                  <button
                    type="button"
                    onClick={async () => {
                      const modal = await posAlert.fire({
                        title: "Nota del item",
                        text: item.name,
                        input: "text",
                        inputValue: item.notes || "",
                        inputPlaceholder: "Ej: sin cebolla",
                        showCancelButton: true,
                        confirmButtonText: "Guardar",
                        cancelButtonText: "Cancelar",
                      });

                      if (!modal.isConfirmed) return;
                      const value =
                        typeof modal.value === "string" ? modal.value : "";
                      updateNotes(item.id, value.trim() ? value.trim() : null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {item.notes ? "Editar" : "Agregar"}
                  </button>
                </div>

                {item.notes && (
                  <div className="text-[12px] font-bold text-red-600 bg-red-500/5 border border-red-500/10 rounded-2xl px-3 py-2">
                    {item.notes}
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Cantidad</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        item.quantity <= 1
                          ? removeItem(item.id)
                          : updateQuantity(item.id, item.quantity - 1)
                      }
                      className="w-8 h-8 rounded-full border border-border bg-background hover:bg-accent/50 transition-colors flex items-center justify-center"
                      aria-label="Disminuir"
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
                      aria-label="Aumentar"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Variante</span>
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
            <span>Items</span>
            <span className="text-foreground font-medium">
              {items.length} (Items)
            </span>
          </div>
          <div className="flex justify-between text-[13px] text-muted-foreground">
            <span>{t("cart.subtotal")}</span>
            <span className="text-foreground font-medium">
              S/{subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-[13px] text-muted-foreground">
            <span>Descuento</span>
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

        {/* Mock Select Payment based on reference */}
        <div className="pt-4 grid grid-cols-2 gap-3 border-t border-border/50 pb-2 hidden">
          <div className="border border-primary bg-primary/5 rounded-xl flex flex-col items-center justify-center py-3 gap-1 cursor-pointer">
            <span className="text-xs font-bold text-primary">
              Pay with Cash
            </span>
          </div>
          <div className="border border-border rounded-xl flex flex-col items-center justify-center py-3 gap-1 opacity-50 cursor-pointer">
            <span className="text-xs font-bold text-foreground">
              Pay with Card
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
    </aside>
  );
}
