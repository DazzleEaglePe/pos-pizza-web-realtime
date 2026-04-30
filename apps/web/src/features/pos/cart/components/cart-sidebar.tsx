"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { useConfig } from "@/hooks/useConfig";
import { useTranslation } from "@/i18n";
import { PaymentDialog } from "@/components/pos/payment-dialog";
import { TableBoardDialog } from "@/components/pos/table-board-dialog";
import { useTableManagement } from "@/components/pos/use-table-management";
import { CashRegisterBar } from "@/components/pos/cash-register-bar";
import { useCashRegister } from "@/hooks/useCashRegister";

import { useCheckout } from "../hooks/use-checkout";
import { OrderTypeHeader } from "./order-type-header";
import { CartItems } from "./cart-items";
import { CartFooter } from "./cart-footer";
import { NoteDialog } from "./note-dialog";

export function CartSidebar() {
  const { items, getTotals, removeItem, updateQuantity } = useCart();
  const { subtotal, tax, total, taxRate } = getTotals();
  const fetchConfig = useConfig((s) => s.fetchConfig);
  const cs = useConfig((s) => s.currencySymbol);
  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const checkout = useCheckout();
  const cr = useCashRegister();
  const [registerOpenTrigger, setRegisterOpenTrigger] = useState(0);

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

  const tm = useTableManagement(checkout.orderType, isAdmin);

  const noteItem = checkout.noteDialogItemId
    ? items.find((i) => i.id === checkout.noteDialogItemId)
    : undefined;

  return (
    <aside className="w-full lg:w-95 h-full min-h-0 bg-sidebar border-l border-sidebar-border flex flex-col relative z-10 shrink-0">
      {/* Cash Register */}
      <CashRegisterBar
        register={cr.register}
        loading={cr.loading}
        onOpen={cr.openRegister}
        onClose={cr.closeRegister}
        onFetchSummary={cr.fetchSummary}
        triggerOpen={registerOpenTrigger}
      />

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-sidebar-border flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold tracking-tight text-foreground">
            {useTranslation().t("cart.currentOrder")}
          </h2>
          {items.length > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary leading-none">
              {items.reduce((acc, i) => acc + i.quantity, 0)}
            </span>
          )}
        </div>

        <OrderTypeHeader
          orderType={checkout.orderType}
          onOrderTypeChange={(type) => {
            checkout.setOrderType(type);
            if (type === "DINE_IN") checkout.setCustomerName("");
            if (type === "TAKEOUT") {
              tm.setTableId(null);
              tm.setTableTouched(false);
            }
            tm.setTableTouched(false);
          }}
          customerName={checkout.customerName}
          onCustomerNameChange={checkout.setCustomerName}
          tableId={tm.tableId}
          tableTouched={tm.tableTouched}
          selectedTable={tm.selectedTable}
          onOpenTableDialog={tm.openTableDialog}
        />
      </div>

      {/* Cart items */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 bg-sidebar custom-scrollbar">
        <CartItems
          items={items}
          onRemove={removeItem}
          onUpdateQuantity={updateQuantity}
          onOpenNote={checkout.openNoteDialog}
        />
      </div>

      {/* Footer */}
      <CartFooter
        cs={cs}
        itemCount={items.length}
        subtotal={subtotal}
        tax={tax}
        taxRate={taxRate}
        total={total}
        hasRegister={!!cr.register}
        registerLoading={cr.loading}
        isSubmitting={checkout.isSubmitting}
        onOpenPayment={() => checkout.setIsPaymentDialogOpen(true)}
        onOpenRegister={() => setRegisterOpenTrigger((n) => n + 1)}
      />

      {/* Note Dialog */}
      <NoteDialog
        open={checkout.noteDialogOpen}
        onOpenChange={checkout.setNoteDialogOpen}
        itemName={noteItem?.name}
        value={checkout.noteDialogValue}
        onValueChange={checkout.setNoteDialogValue}
        onSave={checkout.saveNote}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        isOpen={checkout.isPaymentDialogOpen}
        onOpenChange={checkout.setIsPaymentDialogOpen}
        items={items}
        subtotal={subtotal}
        tax={tax}
        totalAmount={total}
        onConfirm={(paymentDetails) =>
          checkout.handleCheckout(paymentDetails, {
            tableId: tm.tableId,
            setTableTouched: tm.setTableTouched,
            registerId: cr.register?.id ?? null,
          })
        }
        isSubmitting={checkout.isSubmitting}
      />

      {/* Table Board Dialog */}
      <TableBoardDialog
        isOpen={tm.isTableDialogOpen}
        onOpenChange={(open) => {
          tm.setIsTableDialogOpen(open);
          if (open) tm.openTableDialog();
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
