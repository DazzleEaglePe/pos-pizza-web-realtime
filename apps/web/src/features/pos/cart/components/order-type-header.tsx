"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/i18n";
import { getStatusBorder } from "@/components/pos/table-utils";

interface SelectedTable {
  number: number;
  zone?: string | null;
  status: string;
}

interface OrderTypeHeaderProps {
  orderType: "DINE_IN" | "TAKEOUT";
  onOrderTypeChange: (type: "DINE_IN" | "TAKEOUT") => void;
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  /* table */
  tableId: string | null;
  tableTouched: boolean;
  selectedTable: SelectedTable | null;
  onOpenTableDialog: () => void;
}

export function OrderTypeHeader({
  orderType,
  onOrderTypeChange,
  customerName,
  onCustomerNameChange,
  tableId,
  tableTouched,
  selectedTable,
  onOpenTableDialog,
}: OrderTypeHeaderProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Segmented control */}
      <div className="flex bg-muted/60 rounded-sm p-0.5 gap-0.5">
        <button
          type="button"
          onClick={() => onOrderTypeChange("DINE_IN")}
          className={cn(
            "flex-1 h-8 rounded-sm text-xs font-semibold uppercase tracking-wide transition-all",
            orderType === "DINE_IN"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t("cart.dineIn")}
        </button>
        <button
          type="button"
          onClick={() => onOrderTypeChange("TAKEOUT")}
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

      {/* Table selector — dine in */}
      {orderType === "DINE_IN" && (
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={onOpenTableDialog}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-sm border bg-background/60 flex items-center gap-3 transition-colors",
              tableTouched && !tableId
                ? "border-destructive/50 bg-destructive/5"
                : selectedTable
                  ? cn(getStatusBorder(selectedTable.status), "hover:bg-accent/40")
                  : "border-border hover:bg-accent/40",
            )}
          >
            {selectedTable ? (
              <>
                <span
                  className={cn(
                    "w-8 h-8 rounded-sm border-2 flex items-center justify-center shrink-0",
                    getStatusBorder(selectedTable.status),
                  )}
                >
                  <span className="text-xs font-black text-foreground">
                    {selectedTable.number}
                  </span>
                </span>
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="font-semibold text-sm text-foreground">
                    {t("cart.table")} {selectedTable.number}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {selectedTable.zone || ""}
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
          {tableTouched && !tableId && (
            <p className="text-xs text-destructive ml-1">{t("errors.TABLE_REQUIRED")}</p>
          )}
        </div>
      )}

      {/* Customer name — takeout */}
      {orderType === "TAKEOUT" && (
        <Input
          value={customerName}
          onChange={(e) => onCustomerNameChange(e.target.value)}
          placeholder={t("cart.customerNamePlaceholder")}
          className="h-10 rounded-sm bg-background/60 border-border"
        />
      )}
    </>
  );
}
