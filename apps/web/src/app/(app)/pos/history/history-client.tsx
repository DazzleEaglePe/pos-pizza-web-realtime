"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Clock, ExternalLink, History, Search, Ticket, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type OrderRow = {
  id: string;
  ticketNumber: string;
  status: string;
  orderType?: string;
  customerName?: string | null;
  table?: { number: number } | null;
  total: number;
  createdAt: string;
  deliveredAt?: string | null;
  items?: Array<{
    productName: string;
    quantity: number;
    variantName?: string | null;
  }>;
};

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "DELIVERED"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
      : status === "CANCELLED"
        ? "bg-red-500/10 text-red-700 border-red-200"
        : "bg-muted text-muted-foreground border-border";

  const label =
    status === "DELIVERED"
      ? "Entregado"
      : status === "CANCELLED"
        ? "Cancelado"
        : status;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider ${cls}`}
    >
      {label}
    </span>
  );
}

export function HistoryClient({
  initialOrders,
}: {
  initialOrders: OrderRow[];
}) {
  const [query, setQuery] = useState("");

  const all = useMemo(() => {
    const list = Array.isArray(initialOrders) ? initialOrders : [];
    return list.filter(
      (o) => o.status === "DELIVERED" || o.status === "CANCELLED",
    );
  }, [initialOrders]);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return all;
    return all.filter((o) => String(o.ticketNumber).toUpperCase().includes(q));
  }, [all, query]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center">
              <History className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Historial
            </h1>
          </div>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Pedidos entregados y cancelados.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <Badge variant="outline" className="h-7 px-3">
              {all.length} registros
            </Badge>
          </div>
        </div>

        <Link
          href="/pos/orders"
          className="hidden sm:inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:opacity-95 transition-opacity"
        >
          Ver activos
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      <div className="bg-card border border-border rounded-3xl p-4 sm:p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-muted/60 flex items-center justify-center">
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Buscar por ticket
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: TKT-260312-0012"
              className="mt-1 w-full bg-transparent outline-none text-sm font-bold tracking-wide text-foreground placeholder:text-muted-foreground"
            />
          </div>
          {query.trim() && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="w-10 h-10 rounded-2xl hover:bg-accent/60 transition-colors flex items-center justify-center"
              aria-label="Limpiar"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-6 text-sm font-semibold text-muted-foreground">
            No hay resultados.
          </div>
        ) : (
          filtered.map((order) => <HistoryCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  );
}

function HistoryCard({ order }: { order: OrderRow }) {
  const isSalon = order.orderType === "DINE_IN" || order.orderType === "SALON";
  const created = new Date(order.createdAt);
  const delivered = order.deliveredAt ? new Date(order.deliveredAt) : null;

  return (
    <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight text-foreground">
              {order.ticketNumber}
            </span>
            <StatusPill status={order.status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {created.toLocaleString("es-PE", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {delivered && (
              <span className="inline-flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5" />
                {delivered.toLocaleTimeString("es-PE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            <span className="mx-1">•</span>
            {isSalon
              ? typeof order?.table?.number === "number"
                ? `Mesa ${order.table.number}`
                : "Salón"
              : order.customerName || "Para llevar"}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-muted-foreground font-semibold">
            Total
          </div>
          <div className="text-xl font-black text-primary">
            S/ {Number(order.total).toFixed(2)}
          </div>
        </div>
      </div>

      {Array.isArray(order.items) && order.items.length > 0 && (
        <div className="mt-4 space-y-2">
          {order.items.slice(0, 3).map((it, idx) => (
            <div key={idx} className="text-sm font-semibold text-foreground">
              {it.quantity}x {it.productName}
              {it.variantName ? ` (${it.variantName})` : ""}
            </div>
          ))}
          {order.items.length > 3 && (
            <div className="text-xs font-bold text-muted-foreground">
              +{order.items.length - 3} items mas
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <Link
          href={`/tracking/${encodeURIComponent(order.ticketNumber)}`}
          target="_blank"
          className="text-xs font-black text-primary hover:underline inline-flex items-center gap-2"
        >
          Ver tracking <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
