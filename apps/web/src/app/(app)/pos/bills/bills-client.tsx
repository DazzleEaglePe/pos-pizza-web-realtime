"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Printer, ReceiptText, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  PosPageHeader,
  PosSearchCard,
  PosEmptyCard,
} from "@pos-pizza/ui";

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0, 0, 0.2, 1] as const } },
};

const listVariants = {
  visible: { transition: { staggerChildren: 0.04 } },
};

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
      <PosPageHeader
        icon={<ReceiptText className="w-5 h-5 text-primary" />}
        title="Facturas"
        description="Registro de pagos y reimpresion de tickets."
        cta={{
          label: "Volver al POS",
          href: "/pos",
          icon: <ExternalLink className="w-4 h-4" />,
        }}
      >
        <Badge variant="outline" className="h-7 px-3">
          {all.length} transacciones
        </Badge>
      </PosPageHeader>

      <PosSearchCard
        value={query}
        onChange={setQuery}
        placeholder="Ej: TKT-260312-0012"
      />

      {filtered.length === 0 ? (
        <PosEmptyCard text="No hay resultados." />
      ) : (
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {filtered.map((tx) => (
            <motion.div key={tx.id} variants={cardVariants}>
              <BillCard tx={tx} />
            </motion.div>
          ))}
        </motion.div>
      )}
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
    <div className="bg-card border border-border rounded-sm p-5 shadow-sm">
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
