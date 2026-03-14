"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStatusBorder, formatTicketList } from "./table-utils";
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
      <DialogContent className="sm:max-w-230 max-h-[85vh] p-0 gap-0 overflow-hidden rounded-2xl">
        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-3 flex flex-col gap-3 border-b border-border/50">
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
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground shrink-0 pt-1.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {t("tables.statusAvailable")}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-destructive" />
                {t("tables.statusOccupied")}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {t("tables.statusReserved")}
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-2">
            {/* Zone tabs */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center bg-muted/60 rounded-lg p-0.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => onZoneFilterChange("*")}
                  className={`h-7 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
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
                    className={`h-7 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
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
                size="icon-xs"
                onClick={onRefresh}
                disabled={tablesLoading || activeOrdersLoading}
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${tablesLoading || activeOrdersLoading ? "animate-spin" : ""}`}
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
                    className={`h-7 px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      statusFilter === f.key
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.dot && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${f.dot}`}
                        aria-hidden
                      />
                    )}
                    {f.label}
                  </button>
                ))}
              </div>

              <span className="text-[11px] text-muted-foreground">
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
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4 p-5">
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
          <div className="px-5 py-3 border-t border-border/50 bg-card flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg border-2 ${getStatusBorder(dialogSelectedTable.status)} flex items-center justify-center shrink-0`}
              >
                <span className="text-sm font-black text-foreground">
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

            <div className="flex items-center gap-2 shrink-0">
              {String(dialogSelectedTable.status || "").toUpperCase() !==
                "AVAILABLE" && (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => void onReleaseTable(dialogSelectedTable)}
                >
                  {t("tables.releaseAction")}
                </Button>
              )}
              <Button
                type="button"
                size="xs"
                onClick={() => void onConfirmSelect(dialogSelectedTable)}
                disabled={
                  String(dialogSelectedTable.status || "").toUpperCase() ===
                  "RESERVED"
                }
              >
                {t("tables.selectAction")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
