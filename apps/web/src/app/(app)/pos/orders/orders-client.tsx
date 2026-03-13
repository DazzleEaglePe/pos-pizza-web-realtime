"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Clock, ExternalLink, Loader2, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { posAlert } from "@/lib/sweetalert";

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

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "RECEIVED"
      ? "bg-primary/10 text-primary border-primary/20"
      : status === "READY"
        ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
        : "bg-amber-500/10 text-amber-700 border-amber-200";

  const label =
    status === "RECEIVED"
      ? "Recibido"
      : status === "PREPARING"
        ? "Preparando"
        : status === "IN_OVEN"
          ? "En horno"
          : status === "READY"
            ? "Listo"
            : status;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider ${cls}`}
    >
      {label}
    </span>
  );
}

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
    <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight text-foreground">
              {order.ticketNumber}
            </span>
            <StatusPill status={order.status} />
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
            className="h-10 px-4 rounded-full bg-emerald-500 text-white font-black text-xs uppercase tracking-wider hover:opacity-95 transition-opacity"
          >
            Marcar entregado
          </button>
        ) : canCancel ? (
          <button
            type="button"
            onClick={() => onCancel(order)}
            className="h-10 px-4 rounded-full border border-red-200 bg-red-500/10 text-red-700 font-black text-xs uppercase tracking-wider hover:bg-red-500/15 transition-colors"
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
      confirmButtonColor: "#ff5757",
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
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Pedidos
            </h1>
          </div>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Vista rapida de pedidos activos y listos para entregar.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <Badge variant="outline" className="h-7 px-3">
              {orders.length} activos
            </Badge>
            <span className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? "bg-emerald-400" : "bg-gray-300"
                }`}
                aria-hidden
              />
              {isConnected ? "En vivo" : "Sin conexion"}
            </span>
          </div>
        </div>

        <Link
          href="/kitchen"
          className="hidden sm:inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:opacity-95 transition-opacity"
        >
          Ir a cocina
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
              Recibidos
            </h2>
            <Badge className="bg-primary/10 text-primary border border-primary/20">
              {received.length}
            </Badge>
          </div>
          {received.length === 0 ? (
            <EmptyState text="No hay pedidos nuevos." />
          ) : (
            received.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                now={now}
                onDelivered={onDelivered}
                onCancel={onCancel}
              />
            ))
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
              En preparacion
            </h2>
            <Badge className="bg-amber-500/10 text-amber-700 border border-amber-200">
              {preparing.length}
            </Badge>
          </div>
          {preparing.length === 0 ? (
            <EmptyState text="Sin pedidos en cocina." />
          ) : (
            preparing.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                now={now}
                onDelivered={onDelivered}
                onCancel={onCancel}
              />
            ))
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
              Listos
            </h2>
            <Badge className="bg-emerald-500/10 text-emerald-700 border border-emerald-200">
              {ready.length}
            </Badge>
          </div>
          {ready.length === 0 ? (
            <EmptyState text="Aun no hay pedidos listos." />
          ) : (
            ready.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                now={now}
                onDelivered={onDelivered}
                onCancel={onCancel}
              />
            ))
          )}

          {isUpdating && (
            <div className="fixed bottom-5 right-5 bg-card border border-border rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm font-bold text-foreground">
                Guardando...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-card border border-border rounded-3xl p-6 text-sm font-semibold text-muted-foreground">
      {text}
    </div>
  );
}
