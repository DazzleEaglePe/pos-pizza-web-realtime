"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ExternalLink,
  Printer,
  ReceiptText,
  Search,
  Wallet,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TxRow = {
  id: string;
  paymentMethod: string;
  amount: number;
  cashReceived?: number | null;
  changeAmount?: number | null;
  referenceNumber?: string | null;
  status: string;
  createdAt: string;
  order?: {
    id: string;
    ticketNumber: string;
    status: string;
    total: number;
    orderType?: string;
    customerName?: string | null;
    table?: { number: number } | null;
    createdAt: string;
  };
};

function methodLabel(method: string) {
  if (method === "CASH") return "Efectivo";
  if (method === "YAPE") return "Yape";
  if (method === "PLIN") return "Plin";
  if (method === "CARD") return "Tarjeta";
  return method;
}

export function BillsClient({
  initialTransactions,
}: {
  initialTransactions: TxRow[];
}) {
  const [query, setQuery] = useState("");

  const all = useMemo(() => {
    const list = Array.isArray(initialTransactions) ? initialTransactions : [];
    return list.filter((t) => t?.order?.ticketNumber);
  }, [initialTransactions]);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return all;
    return all.filter((t) =>
      String(t.order?.ticketNumber || "")
        .toUpperCase()
        .includes(q),
    );
  }, [all, query]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center">
              <ReceiptText className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Facturas
            </h1>
          </div>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Registro de pagos y reimpresion de tickets.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <Badge variant="outline" className="h-7 px-3">
              {all.length} transacciones
            </Badge>
          </div>
        </div>

        <Link
          href="/pos"
          className="hidden sm:inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:opacity-95 transition-opacity"
        >
          Volver al POS
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
          filtered.map((tx) => <BillCard key={tx.id} tx={tx} />)
        )}
      </div>
    </div>
  );
}

function BillCard({ tx }: { tx: TxRow }) {
  const ticket = tx.order?.ticketNumber || "";
  const isSalon =
    tx.order?.orderType === "DINE_IN" || tx.order?.orderType === "SALON";
  const place = isSalon
    ? typeof tx.order?.table?.number === "number"
      ? `Mesa ${tx.order.table.number}`
      : "Salón"
    : tx.order?.customerName || "Para llevar";

  const created = new Date(tx.createdAt);
  const trackingHref = `/tracking/${encodeURIComponent(ticket)}`;
  const printHref = `/print/ticket/${encodeURIComponent(ticket)}`;

  return (
    <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-black tracking-tight text-foreground">
            {ticket}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" />
              {methodLabel(String(tx.paymentMethod || ""))}
            </span>
            <span className="mx-1">•</span>
            {place}
            <span className="mx-1">•</span>
            {created.toLocaleString("es-PE", {
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>

          {tx.paymentMethod === "CASH" && Number(tx.changeAmount || 0) > 0 && (
            <div className="mt-3 text-xs font-black text-red-600">
              Vuelto: S/ {Number(tx.changeAmount || 0).toFixed(2)}
            </div>
          )}

          {tx.paymentMethod !== "CASH" && tx.referenceNumber && (
            <div className="mt-3 text-xs font-bold text-muted-foreground">
              Ref: {tx.referenceNumber}
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-xs text-muted-foreground font-semibold">
            Monto
          </div>
          <div className="text-xl font-black text-primary">
            S/ {Number(tx.amount).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Link
          href={trackingHref}
          target="_blank"
          className="text-xs font-black text-primary hover:underline inline-flex items-center gap-2"
        >
          Ver tracking <ExternalLink className="w-4 h-4" />
        </Link>

        <Link
          href={printHref}
          target="_blank"
          className="h-10 px-4 rounded-full border border-border bg-background hover:bg-accent/50 transition-colors text-foreground font-black text-xs uppercase tracking-wider inline-flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Reimprimir
        </Link>
      </div>
    </div>
  );
}
