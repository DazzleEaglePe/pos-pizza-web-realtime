"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useConfig } from "@/hooks/useConfig";
import { useTranslation } from "@/i18n";
import { apiFetch } from "@/lib/api";
import { posAlert } from "@/lib/sweetalert";
import { handleApiError } from "@/lib/api-error-handler";
import type { CreateOrderResult } from "../types";

export interface UseCheckoutReturn {
  orderType: "DINE_IN" | "TAKEOUT";
  setOrderType: (t: "DINE_IN" | "TAKEOUT") => void;
  customerName: string;
  setCustomerName: (n: string) => void;
  isSubmitting: boolean;
  isPaymentDialogOpen: boolean;
  setIsPaymentDialogOpen: (open: boolean) => void;
  /* note dialog */
  noteDialogOpen: boolean;
  setNoteDialogOpen: (open: boolean) => void;
  noteDialogItemId: string | null;
  noteDialogValue: string;
  setNoteDialogValue: (v: string) => void;
  openNoteDialog: (itemId: string, currentNote: string | null) => void;
  saveNote: () => void;
  /* checkout */
  handleCheckout: (
    paymentDetails: {
      paymentMethod: string;
      cashReceived?: number;
      referenceNumber?: string;
      cashAmount?: number;
      digitalAmount?: number;
      digitalMethod?: string;
    },
    options: { tableId: string | null; setTableTouched: (v: boolean) => void; registerId: string | null },
  ) => Promise<void>;
}

export function useCheckout(): UseCheckoutReturn {
  const { items, clearCart } = useCart();
  const updateNotes = useCart((s) => s.updateNotes);
  const cs = useConfig((s) => s.currencySymbol);
  const { t, locale } = useTranslation();

  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEOUT">("DINE_IN");
  const [customerName, setCustomerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  /* note dialog state */
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteDialogItemId, setNoteDialogItemId] = useState<string | null>(null);
  const [noteDialogValue, setNoteDialogValue] = useState("");

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

  const handleCheckout = async (
    paymentDetails: {
      paymentMethod: string;
      cashReceived?: number;
      referenceNumber?: string;
      cashAmount?: number;
      digitalAmount?: number;
      digitalMethod?: string;
    },
    options: { tableId: string | null; setTableTouched: (v: boolean) => void; registerId: string | null },
  ) => {
    if (items.length === 0 || !options.registerId) return;
    setIsSubmitting(true);

    try {
      if (orderType === "DINE_IN" && !options.tableId) {
        options.setTableTouched(true);
        throw new Error("TABLE_REQUIRED");
      }

      const payload = {
        orderType,
        tableId: orderType === "DINE_IN" ? options.tableId : null,
        customerName: orderType === "TAKEOUT" ? customerName.trim() || null : null,
        items: items.map((item) => ({
          productId: item.promotionId ? null : item.productId,
          promotionId: item.promotionId ?? null,
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
                    <div style="font-weight:900; color:var(--primary); font-size:28px; margin-top:4px; line-height:1;">${cs} ${changeAmount.toFixed(2)}</div>
                  </div>`
                : ""
            }
          </div>
        `,
      });
    } catch (error: unknown) {
      console.error("Order submission failed", error);
      handleApiError(error, t);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    orderType,
    setOrderType,
    customerName,
    setCustomerName,
    isSubmitting,
    isPaymentDialogOpen,
    setIsPaymentDialogOpen,
    noteDialogOpen,
    setNoteDialogOpen,
    noteDialogItemId,
    noteDialogValue,
    setNoteDialogValue,
    openNoteDialog,
    saveNote,
    handleCheckout,
  };
}
