"use client";

import { useTranslation } from "@/i18n";
import { getStatusDot, formatTicketList } from "./table-utils";
import type { Table, ActiveOrder } from "./types";

interface TableCardProps {
  tb: Table;
  isSelected: boolean;
  ordersForTable: ActiveOrder[];
  onSelect: () => void;
}

export function TableCard({
  tb,
  isSelected,
  ordersForTable,
  onSelect,
}: TableCardProps) {
  const { t } = useTranslation();

  const status = String(tb.status || "").toUpperCase();
  const tickets = ordersForTable.map((o) => o.ticketNumber);
  const ticketText = tickets.length ? formatTicketList(tickets) : "";
  const dot = getStatusDot(status);
  const seats = Math.min(tb.capacity || 4, 8);

  const borderColor = isSelected
    ? "border-primary"
    : status === "OCCUPIED"
      ? "border-destructive/30"
      : status === "RESERVED"
        ? "border-amber-500/30"
        : "border-border";

  const bgColor = isSelected
    ? "bg-primary/5"
    : status === "OCCUPIED"
      ? "bg-destructive/[0.03]"
      : status === "RESERVED"
        ? "bg-amber-500/[0.03]"
        : "bg-card";

  const getStatusLabel = (s: string) => {
    const upper = String(s || "").toUpperCase();
    if (upper === "AVAILABLE") return t("tables.statusAvailable");
    if (upper === "OCCUPIED") return t("tables.statusOccupied");
    if (upper === "RESERVED") return t("tables.statusReserved");
    return upper;
  };

  const chairClass =
    status === "OCCUPIED"
      ? "bg-destructive/40"
      : status === "RESERVED"
        ? "bg-amber-500/40"
        : "bg-muted-foreground/20";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col items-center gap-2 p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
        isSelected ? "scale-[1.03]" : "hover:scale-[1.02]"
      }`}
    >
      {/* Top chairs */}
      <div className="flex justify-center gap-1.5">
        {Array.from({ length: Math.ceil(seats / 2) }).map((_, i) => (
          <span
            key={`t${i}`}
            className={`w-3 h-1.5 rounded-full transition-colors ${chairClass}`}
          />
        ))}
      </div>

      {/* Table surface */}
      <div
        className={`w-full aspect-square rounded-xl border-2 ${borderColor} ${bgColor} flex flex-col items-center justify-center transition-all ${
          isSelected ? "shadow-md" : "shadow-sm group-hover:shadow-md"
        }`}
      >
        <span className="text-2xl font-black tracking-tight text-foreground leading-none">
          {tb.number}
        </span>
        <span className="flex items-center gap-1 mt-1">
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} aria-hidden />
          <span className="text-[10px] text-muted-foreground">
            {getStatusLabel(tb.status)}
          </span>
        </span>
        {ticketText && (
          <span className="text-[10px] text-muted-foreground/70 mt-1 max-w-full truncate px-2">
            {ticketText}
          </span>
        )}
      </div>

      {/* Bottom chairs */}
      <div className="flex justify-center gap-1.5">
        {Array.from({ length: Math.floor(seats / 2) }).map((_, i) => (
          <span
            key={`b${i}`}
            className={`w-3 h-1.5 rounded-full transition-colors ${chairClass}`}
          />
        ))}
      </div>
    </button>
  );
}
