"use client";

import { Pencil, Clock, CheckCircle2, ReceiptText, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/hooks/useCart";
import { useState } from "react";
import { posAlert } from "@/lib/sweetalert";
import { useTranslation } from "@/i18n";

export function CartSidebar() {
  const { items, getTotals, removeItem, clearCart } = useCart();
  const { subtotal, tax, total } = getTotals();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    
    try {
      const payload = {
        orderType: "DINE_IN",
        tableId: null,
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          variantName: item.variantName,
          notes: item.notes,
        }))
      };

      const token = localStorage.getItem("pos_access_token");

      const response = await fetch("http://localhost:3001/orders", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      const result = await response.json();
      
      clearCart();
      await posAlert.fire({
        icon: 'success',
        title: t("cart.orderPlaced"),
        text: t("cart.orderPlacedText", { ticket: result.ticketNumber }),
        iconColor: '#00BFA6',
      });
    } catch (error) {
      console.error("Order submission failed", error);
      await posAlert.fire({
        icon: 'error',
        title: t("cart.checkoutFailed"),
        text: t("cart.checkoutFailedText"),
        confirmButtonColor: '#ff5757',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="w-full lg:w-[380px] h-full bg-background border-l border-border flex flex-col relative z-10 transition-all duration-500 shrink-0">
      
      {/* Header Info */}
      <div className="p-6 pb-4 border-b border-border/50 flex flex-col gap-4 bg-card text-card-foreground">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Bill Details</h2>
          <span className="text-sm font-medium text-muted-foreground tracking-wider">#546234</span>
        </div>
        
        {/* Mock Customer Input matching reference */}
        <div className="space-y-1.5 mt-2">
          <label className="text-xs font-semibold text-foreground ml-1">Customer Name</label>
          <div className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-muted-foreground flex items-center">
            Customer Name...
          </div>
        </div>
      </div>

      {/* Cart Items List */}
      <ScrollArea className="flex-1 px-6 pb-4 bg-card">
         <div className="space-y-6 pt-6 flex flex-col h-full">
            {items.length === 0 ? (
              <div className="text-center text-muted-foreground flex flex-col items-center gap-3 py-16 m-auto">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-2">
                  <ShoppingBag className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="font-semibold text-foreground text-base">{t("cart.noItemSelected")}</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex flex-col gap-1.5 group relative">
                    <div className="flex justify-between items-start">
                       <h4 className="font-bold text-foreground leading-tight text-sm pr-4">{item.name}</h4>
                       <span className="font-bold text-primary text-sm whitespace-nowrap">S/{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Amount</span>
                      <span className="font-medium text-foreground">{item.quantity}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Variant</span>
                      <span className="font-medium text-foreground">{item.variantName || t("cart.regular")}</span>
                    </div>

                    <button onClick={() => removeItem(item.id)} className="absolute -left-4 top-0 bottom-0 flex items-center justify-center text-muted-foreground/50 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
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
               <span>Item</span>
               <span className="text-foreground font-medium">{items.length} (Items)</span>
            </div>
            <div className="flex justify-between text-[13px] text-muted-foreground">
               <span>{t("cart.subtotal")}</span>
               <span className="text-foreground font-medium">S/{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[13px] text-muted-foreground">
               <span>Discount</span>
               <span className="text-primary font-medium">- S/0.00</span>
            </div>
            <div className="flex justify-between text-[13px] text-muted-foreground">
               <span>{t("cart.tax")} (18%)</span>
               <span className="text-foreground font-medium">S/{tax.toFixed(2)}</span>
            </div>
            
            <div className="pt-4 mt-2 flex justify-between items-center">
               <span className="text-sm font-bold text-foreground uppercase">{t("cart.total")}</span>
               <span className="text-2xl font-black text-primary tracking-tight">S/{total.toFixed(2)}</span>
            </div>
         </div>

         {/* Mock Select Payment based on reference */}
         <div className="pt-4 grid grid-cols-2 gap-3 border-t border-border/50 pb-2 hidden">
            <div className="border border-primary bg-primary/5 rounded-xl flex flex-col items-center justify-center py-3 gap-1 cursor-pointer">
              <span className="text-xs font-bold text-primary">Pay with Cash</span>
            </div>
            <div className="border border-border rounded-xl flex flex-col items-center justify-center py-3 gap-1 opacity-50 cursor-pointer">
              <span className="text-xs font-bold text-foreground">Pay with Card</span>
            </div>
         </div>

         <div className="pt-2">
            <Button 
              onClick={handleCheckout} 
              disabled={items.length === 0 || isSubmitting}
              className="h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm w-full rounded-full transition-all active:scale-[0.98] disabled:opacity-50"
            >
               {isSubmitting ? t("cart.processing") : "Process Transaction"}
            </Button>
         </div>
      </div>
    </aside>
  );
}
