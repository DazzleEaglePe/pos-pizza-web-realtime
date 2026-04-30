"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ExternalLink, Loader2, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { posAlert } from "@/lib/sweetalert";
import { isUnauthorized, handleSessionExpired } from "@/lib/api-error-handler";
import {
  PosPageHeader,
  PosStatusPill,
  PosEmptyCard,
  PosSectionHeader,
} from "@pos-pizza/ui";

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0, 0, 0.2, 1] as const } },
  exit:   { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

const listVariants = {
  visible: { transition: { staggerChildren: 0.04 } },
};

type ActiveOrder = {
  id: string;
  ticketNumber: string;
  status: string;
  orderType?: string;
  customerName?: string | null;
  table?: { number: number } | null;
  total: number;
  createdAt: string;
  items?: Array<{
    id: string;
    productName: string;
    variantName?: string | null;
    quantity: number;
    notes?: string | null;
  }>;
};

function OrderCard({
  order,
  now,
  onDelivered,
  onCancel,
}: {
  order: ActiveOrder;
  now: number;
  onDelivered: (orderId: string) => Promise<void>;
  onCancel: (order: ActiveOrder) => Promise<void>;
}) {
  const mins = Math.max(
    0,
    Math.floor((now - new Date(order.createdAt).getTime()) / 60000),
  );
  const time = mins === 0 ? "<1 min" : `${mins} min`;
  const isReady = order.status === "READY";
  const canCancel = order.status === "RECEIVED";
  const isSalon = order.orderType === "DINE_IN" || order.orderType === "SALON";

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
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            hace {time}
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
          {order.items.slice(0, 3).map((it) => (
            <div key={it.id} className="text-sm font-semibold text-foreground">
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

        {isReady ? (
          <button
            type="button"
            onClick={() => onDelivered(order.id)}
            className="h-10 px-4 rounded-sm bg-emerald-500 text-primary-foreground font-black text-xs uppercase tracking-wider hover:opacity-95 transition-opacity"
          >
            Marcar entregado
          </button>
        ) : canCancel ? (
          <button
            type="button"
            onClick={() => onCancel(order)}
            className="h-10 px-4 rounded-sm border border-red-200 bg-red-500/10 text-red-700 font-black text-xs uppercase tracking-wider hover:bg-red-500/15 transition-colors"
          >
            Cancelar
          </button>
        ) : (
          <span className="text-xs font-bold text-muted-foreground">
            En cocina
          </span>
        )}
      </div>
    </div>
  );
}

export function OrdersClient({
  initialOrders,
}: {
  initialOrders: ActiveOrder[];
}) {
  const [orders, setOrders] = useState<ActiveOrder[]>(
    Array.isArray(initialOrders) ? initialOrders : [],
  );
  const [now, setNow] = useState(() => Date.now());
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const { isConnected, updateOrderStatus, cancelOrder } = useRealtimeOrders({
    onOrderCreated: (newOrder) => {
      const mapped: ActiveOrder = {
        id: newOrder.id,
        ticketNumber: newOrder.ticketNumber,
        status: newOrder.status,
        orderType: newOrder.orderType,
        customerName: newOrder.customerName ?? null,
        table: newOrder.table ?? null,
        total: typeof newOrder.total === "number" ? newOrder.total : 0,
        createdAt: newOrder.createdAt || new Date().toISOString(),
        items: Array.isArray(newOrder.items) ? newOrder.items : [],
      };

      setOrders((prev) => {
        if (prev.some((o) => o.id === mapped.id)) return prev;
        return [mapped, ...prev];
      });
    },
    onOrderStatusUpdated: ({ orderId, status }) => {
      setOrders((prev) => {
        if (status === "DELIVERED" || status === "CANCELLED") {
          return prev.filter((o) => o.id !== orderId);
        }
        return prev.map((o) => (o.id === orderId ? { ...o, status } : o));
      });
    },
  });

  const received = useMemo(
    () => orders.filter((o) => o.status === "RECEIVED"),
    [orders],
  );
  const preparing = useMemo(
    () =>
      orders.filter((o) => o.status === "PREPARING" || o.status === "IN_OVEN"),
    [orders],
  );
  const ready = useMemo(
    () => orders.filter((o) => o.status === "READY"),
    [orders],
  );

  const onDelivered = async (orderId: string) => {
    if (isUpdating) return;
    setIsUpdating(orderId);
    try {
      await updateOrderStatus(orderId, "DELIVERED");
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err: any) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      console.error(err);
      posAlert.fire({
        toast: true,
        position: "top-end",
        timer: 2200,
        showConfirmButton: false,
        icon: "error",
        title: "No se pudo marcar como entregado",
        text: err?.message || "Intenta de nuevo.",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const onCancel = async (order: ActiveOrder) => {
    if (isUpdating) return;

    const modal = await posAlert.fire({
      title: "Cancelar pedido",
      text: `Ticket ${order.ticketNumber}`,
      icon: "warning",
      input: "text",
      inputPlaceholder: "Motivo (opcional)",
      showCancelButton: true,
      confirmButtonText: "Cancelar",
      cancelButtonText: "Volver",
    });

    if (!modal.isConfirmed) return;

    setIsUpdating(order.id);
    try {
      const reason = typeof modal.value === "string" ? modal.value : null;
      await cancelOrder(order.id, reason);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      posAlert.fire({
        toast: true,
        position: "top-end",
        timer: 1800,
        showConfirmButton: false,
        icon: "success",
        title: "Pedido cancelado",
      });
    } catch (err: any) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      console.error(err);
      posAlert.fire({
        toast: true,
        position: "top-end",
        timer: 2200,
        showConfirmButton: false,
        icon: "error",
        title: "No se pudo cancelar",
        text: err?.message || "Intenta de nuevo.",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <PosPageHeader
        icon={<UtensilsCrossed className="w-5 h-5 text-primary" />}
        title="Pedidos"
        description="Vista rapida de pedidos activos y listos para entregar."
        cta={{
          label: "Ir a cocina",
          href: "/kitchen",
          icon: <ExternalLink className="w-4 h-4" />,
        }}
      >
        <Badge variant="outline" className="h-7 px-3">
          {orders.length} activos
        </Badge>
        <span className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <span
            className={`w-2.5 h-2.5 rounded-sm ${
              isConnected ? "bg-emerald-400" : "bg-muted-foreground/30"
            }`}
            aria-hidden
          />
          {isConnected ? "En vivo" : "Sin conexion"}
        </span>
      </PosPageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recibidos */}
        <div className="space-y-4">
          <PosSectionHeader label="Recibidos" count={received.length} variant="default" />
          <AnimatePresence initial={false}>
            {received.length === 0 ? (
              <PosEmptyCard key="empty-received" text="No hay pedidos nuevos." />
            ) : (
              <motion.div
                key="list-received"
                className="space-y-4"
                variants={listVariants}
                initial="hidden"
                animate="visible"
              >
                {received.map((o) => (
                  <motion.div key={o.id} variants={cardVariants} layout>
                    <OrderCard
                      order={o}
                      now={now}
                      onDelivered={onDelivered}
                      onCancel={onCancel}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* En preparacion */}
        <div className="space-y-4">
          <PosSectionHeader label="En preparacion" count={preparing.length} variant="amber" />
          <AnimatePresence initial={false}>
            {preparing.length === 0 ? (
              <PosEmptyCard key="empty-preparing" text="Sin pedidos en cocina." />
            ) : (
              <motion.div
                key="list-preparing"
                className="space-y-4"
                variants={listVariants}
                initial="hidden"
                animate="visible"
              >
                {preparing.map((o) => (
                  <motion.div key={o.id} variants={cardVariants} layout>
                    <OrderCard
                      order={o}
                      now={now}
                      onDelivered={onDelivered}
                      onCancel={onCancel}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Listos */}
        <div className="space-y-4">
          <PosSectionHeader label="Listos" count={ready.length} variant="emerald" />
          <AnimatePresence initial={false}>
            {ready.length === 0 ? (
              <PosEmptyCard key="empty-ready" text="Aun no hay pedidos listos." />
            ) : (
              <motion.div
                key="list-ready"
                className="space-y-4"
                variants={listVariants}
                initial="hidden"
                animate="visible"
              >
                {ready.map((o) => (
                  <motion.div key={o.id} variants={cardVariants} layout>
                    <OrderCard
                      order={o}
                      now={now}
                      onDelivered={onDelivered}
                      onCancel={onCancel}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {isUpdating && (
        <div className="fixed bottom-5 right-5 bg-card border border-border rounded-sm px-4 py-3 shadow-lg flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm font-bold text-foreground">Guardando...</span>
        </div>
      )}
    </div>
  );
}


