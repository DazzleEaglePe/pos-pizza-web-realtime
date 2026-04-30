"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, ExternalLink, History, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  PosPageHeader,
  PosStatusPill,
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
      <PosPageHeader
        icon={<History className="w-5 h-5 text-primary" />}
        title="Historial"
        description="Pedidos entregados y cancelados."
        cta={{
          label: "Ver activos",
          href: "/pos/orders",
          icon: <ExternalLink className="w-4 h-4" />,
        }}
      >
        <Badge variant="outline" className="h-7 px-3">
          {all.length} registros
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
          {filtered.map((order) => (
            <motion.div key={order.id} variants={cardVariants}>
              <HistoryCard order={order} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
function HistoryCard({ order }: { order: OrderRow }) {
  const isSalon = order.orderType === "DINE_IN" || order.orderType === "SALON";
  const created = new Date(order.createdAt);
  const delivered = order.deliveredAt ? new Date(order.deliveredAt) : null;

  return (
    <div className="bg-card border border-border rounded-sm p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight text-foreground">
              {order.ticketNumber}
            </span>
            <PosStatusPill status={order.status} />
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
