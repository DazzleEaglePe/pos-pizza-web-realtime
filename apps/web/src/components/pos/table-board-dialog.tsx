"use client";

import { RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStatusBorder, getStatusDot, formatTicketList } from "./table-utils";
import { TableCard } from "./table-card";
import type { Table, ActiveOrder } from "./types";

interface TableBoardDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tables: Table[];
  filteredTables: Table[];
  zoneOptions: string[];
  zoneFilter: string;
  onZoneFilterChange: (zone: string) => void;
  statusFilter: "ALL" | "AVAILABLE" | "OCCUPIED" | "RESERVED";
  onStatusFilterChange: (
    status: "ALL" | "AVAILABLE" | "OCCUPIED" | "RESERVED",
  ) => void;
  tablesLoading: boolean;
  activeOrdersLoading: boolean;
  dialogTableId: string | null;
  onDialogTableIdChange: (id: string) => void;
  dialogSelectedTable: Table | null;
  activeOrdersByTableId: Map<string, ActiveOrder[]>;
  onRefresh: () => void;
  onConfirmSelect: (tb: Table) => Promise<void>;
  onReleaseTable: (tb: Table) => Promise<void>;
}

export function TableBoardDialog({
  isOpen,
  onOpenChange,
  tables,
  filteredTables,
  zoneOptions,
  zoneFilter,
  onZoneFilterChange,
  statusFilter,
  onStatusFilterChange,
  tablesLoading,
  activeOrdersLoading,
  dialogTableId,
  onDialogTableIdChange,
  dialogSelectedTable,
  activeOrdersByTableId,
  onRefresh,
  onConfirmSelect,
  onReleaseTable,
}: TableBoardDialogProps) {
  const { t } = useTranslation();

  const zoneLabel = (zone: string) => zone || t("tables.noZone");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-260 max-h-[88vh] p-0 gap-0 overflow-hidden rounded-sm">
        {/* ── Header ── */}
        <div className="px-6 pt-5 pb-4 flex flex-col gap-3 border-b border-border/50">
          {/* Title row + legend */}
          <div className="flex items-start justify-between gap-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold tracking-tight">
                {t("tables.title")}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {t("cart.dineIn")}
              </DialogDescription>
            </DialogHeader>

            {/* Status legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                {t("tables.statusAvailable")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
                {t("tables.statusOccupied")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                {t("tables.statusReserved")}
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-2">
            {/* Zone tabs */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center bg-muted/60 rounded-sm p-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => onZoneFilterChange("*")}
                  className={`h-8 px-4 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
                    zoneFilter === "*"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("tables.filterAll")}
                </button>
                {zoneOptions.map((zone) => (
                  <button
                    key={zone || "__nozone"}
                    type="button"
                    onClick={() => onZoneFilterChange(zone)}
                    className={`h-8 px-4 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
                      zoneFilter === zone
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {zoneLabel(zone)}
                  </button>
                ))}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onRefresh}
                disabled={tablesLoading || activeOrdersLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${tablesLoading || activeOrdersLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>

            {/* Status filter */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {(
                  [
                    { key: "ALL", label: t("tables.filterAll"), dot: null },
                    {
                      key: "AVAILABLE",
                      label: t("tables.filterAvailable"),
                      dot: "bg-primary",
                    },
                    {
                      key: "OCCUPIED",
                      label: t("tables.filterOccupied"),
                      dot: "bg-destructive",
                    },
                    {
                      key: "RESERVED",
                      label: t("tables.filterReserved"),
                      dot: "bg-amber-500",
                    },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => onStatusFilterChange(f.key)}
                    className={`h-8 px-3 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors ${
                      statusFilter === f.key
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.dot && (
                      <span
                        className={`w-2 h-2 rounded-full ${f.dot}`}
                        aria-hidden
                      />
                    )}
                    {f.label}
                  </button>
                ))}
              </div>

              <span className="text-xs text-muted-foreground font-medium">
                {tablesLoading || activeOrdersLoading
                  ? t("common.loading")
                  : `${filteredTables.length}/${tables.length}`}
              </span>
            </div>
          </div>
        </div>

        {/* ── Table grid (scrollable) ── */}
        <div className="flex-1 overflow-auto bg-muted/20">
          {tables.length === 0 && !tablesLoading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              {t("tables.empty")}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 p-6">
              {filteredTables.map((tb) => (
                <TableCard
                  key={tb.id}
                  tb={tb}
                  isSelected={tb.id === dialogTableId}
                  ordersForTable={activeOrdersByTableId.get(tb.id) || []}
                  onSelect={() => onDialogTableIdChange(tb.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer: selected table action bar ── */}
        {dialogSelectedTable && (
          <div className="px-6 py-4 border-t border-border/50 bg-card flex items-center justify-between gap-4">
            <div className="min-w-0 flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-sm border-2 ${getStatusBorder(dialogSelectedTable.status)} flex items-center justify-center shrink-0`}
              >
                <span className="text-base font-black text-foreground">
                  {dialogSelectedTable.number}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  {t("cart.table")} {dialogSelectedTable.number}
                  <span className="text-xs font-normal text-muted-foreground">
                    {zoneLabel((dialogSelectedTable.zone || "").trim())}
                  </span>
                </div>
                {(() => {
                  const tickets =
                    activeOrdersByTableId
                      .get(dialogSelectedTable.id)
                      ?.map((o) => o.ticketNumber) || [];
                  const ticketsText = tickets.length
                    ? formatTicketList(tickets)
                    : "";
                  if (!ticketsText) return null;
                  return (
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {ticketsText}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {String(dialogSelectedTable.status || "").toUpperCase() !==
                "AVAILABLE" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void onReleaseTable(dialogSelectedTable)}
                >
                  {t("tables.releaseAction")}
                </Button>
              )}
              <Button
                type="button"
                size="default"
                onClick={() => void onConfirmSelect(dialogSelectedTable)}
                disabled={
                  String(dialogSelectedTable.status || "").toUpperCase() ===
                  "RESERVED"
                }
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                {t("tables.selectAction")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
