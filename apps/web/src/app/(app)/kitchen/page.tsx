"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { API_URL } from "@/lib/config";
import { getAccessToken } from "@/lib/auth";
import { posAlert } from "@/lib/sweetalert";
import { useKitchenUi } from "./kitchen-ui-context";
import { flashDocumentTitle, playNewOrderSfx } from "./kds-sfx";

export default function KitchenPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [highlighted, setHighlighted] = useState<Record<string, true>>({});

  const { setPendingCount, setIsWsConnected, isSoundEnabled } = useKitchenUi();

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // 1. Fetch initial active orders
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = getAccessToken();

        const res = await fetch(`${API_URL}/orders/active`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!res.ok) {
          throw new Error(`Failed to load active orders (${res.status})`);
        }

        const data: unknown = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.data)
            ? (data as any).data
            : [];

        if (!cancelled) setOrders(list);
      } catch (err) {
        console.error("Failed to load active orders", err);
        posAlert.fire({
          toast: true,
          position: "top-end",
          timer: 2500,
          showConfirmButton: false,
          icon: "error",
          title: "No se pudo cargar cocina",
          text: "Revisa que el backend este corriendo y tu sesion sea valida.",
        });
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Real-time updates
  const { updateOrderStatus, isConnected } = useRealtimeOrders({
    onOrderCreated: (newOrder) => {
      setOrders((prev) => {
        // Prevent duplicates if already exists
        if (prev.find((o) => o.id === newOrder.id)) return prev;
        return [newOrder, ...prev];
      });

      setHighlighted((prev) => ({ ...prev, [newOrder.id]: true }));
      window.setTimeout(() => {
        setHighlighted((prev) => {
          const copy = { ...prev };
          delete copy[newOrder.id];
          return copy;
        });
      }, 12_000);

      posAlert.fire({
        toast: true,
        position: "top-end",
        timer: 3500,
        showConfirmButton: false,
        icon: "info",
        title: "Nuevo pedido",
        text: newOrder.ticketNumber ? `Ticket ${newOrder.ticketNumber}` : "",
      });

      flashDocumentTitle(
        newOrder.ticketNumber
          ? `Nuevo pedido: ${newOrder.ticketNumber}`
          : "Nuevo pedido",
      );

      if (isSoundEnabled) {
        playNewOrderSfx();
      }
    },
    onOrderStatusUpdated: ({ orderId, status, ...rest }) => {
      setOrders((prev) => {
        if (status === "DELIVERED" || status === "CANCELLED") {
          return prev.filter((o) => o.id !== orderId);
        }
        return prev.map((o) =>
          o.id === orderId ? { ...o, status, ...rest } : o,
        );
      });
    },
    onOrderCancelled: ({ orderId }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED" } : o)),
      );
    },
  });

  const safeOrders = Array.isArray(orders) ? orders : [];

  const activeCount = useMemo(() => {
    const activeStatuses = new Set([
      "RECEIVED",
      "PREPARING",
      "IN_OVEN",
      "READY",
    ]);
    return safeOrders.filter((o) => activeStatuses.has(o.status)).length;
  }, [safeOrders]);

  useEffect(() => {
    setPendingCount(activeCount);
  }, [activeCount, setPendingCount]);

  useEffect(() => {
    setIsWsConnected(isConnected);
  }, [isConnected, setIsWsConnected]);

  if (loading)
    return (
      <div className="p-10 text-white font-bold flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        Cargando pedidos...
      </div>
    );

  // Filter columns
  const newOrders = safeOrders.filter((o) => o.status === "RECEIVED");
  const preparingOrders = safeOrders.filter(
    (o) => o.status === "PREPARING" || o.status === "IN_OVEN",
  );
  const readyOrders = safeOrders.filter((o) => o.status === "READY");

  const handleUpdate = async (orderId: string, status: string) => {
    const updated = await updateOrderStatus(orderId, status);

    setOrders((prev) => {
      const without = prev.filter((o) => o.id !== orderId);
      if (status === "DELIVERED" || status === "CANCELLED") return without;
      const next = prev.map((o) => (o.id === orderId ? { ...o, status } : o));
      return next;
    });

    return updated;
  };

  return (
    <div className="flex gap-4 sm:gap-6 h-full w-max min-w-full pr-4 sm:pr-6">
      <OrderColumn
        title="Nuevos (Recibidos)"
        count={newOrders.length}
        type="new"
        items={newOrders}
        onUpdate={handleUpdate}
        now={now}
        highlighted={highlighted}
      />
      <OrderColumn
        title="En Preparación"
        count={preparingOrders.length}
        type="progress"
        items={preparingOrders}
        onUpdate={handleUpdate}
        now={now}
        highlighted={highlighted}
      />
      <OrderColumn
        title="Listos para Entregar"
        count={readyOrders.length}
        type="done"
        items={readyOrders}
        onUpdate={handleUpdate}
        now={now}
        highlighted={highlighted}
      />
    </div>
  );
}

function OrderColumn({
  title,
  count,
  type,
  items,
  onUpdate,
  now,
  highlighted,
}: any) {
  return (
    <div className="flex flex-col w-[calc(100vw-2rem)] sm:w-[360px] lg:w-[380px] max-w-[440px] h-full min-h-0 shrink-0 snap-start">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
          {title}{" "}
          <span className="text-sm bg-[#1c1c1c] text-primary px-3 py-1 rounded-full font-black border border-primary/20">
            {count}
          </span>
        </h2>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-4 pb-12">
        {items.length === 0 ? (
          <div className="text-sm text-gray-400 px-2 py-8">
            Sin pedidos aqui por ahora.
          </div>
        ) : (
          items.map((order: any) => (
            <OrderTicket
              key={order.id}
              type={type}
              order={order}
              onUpdate={onUpdate}
              now={now}
              isHighlighted={Boolean(highlighted?.[order.id])}
            />
          ))
        )}
      </div>
    </div>
  );
}

function OrderTicket({ type, order, onUpdate, now, isHighlighted }: any) {
  const isNew = type === "new";
  const isProgress = type === "progress";
  const isDone = type === "done";

  const [isUpdating, setIsUpdating] = useState(false);

  const isSalon = order.orderType === "DINE_IN" || order.orderType === "SALON";
  const timeElapsed = Math.floor(
    (now - new Date(order.createdAt).getTime()) / 60000,
  );

  const ageLabel = timeElapsed > 0 ? `${timeElapsed} min` : "<1 min";
  const ageTone =
    timeElapsed >= 20
      ? "late"
      : timeElapsed >= 12
        ? "warn"
        : timeElapsed >= 6
          ? "ok"
          : "fresh";

  const ageClass =
    ageTone === "late"
      ? "bg-red-500/10 text-red-200 border-red-500/20"
      : ageTone === "warn"
        ? "bg-orange-500/10 text-orange-200 border-orange-500/20"
        : ageTone === "ok"
          ? "bg-yellow-500/10 text-yellow-200 border-yellow-500/20"
          : "bg-emerald-500/10 text-emerald-200 border-emerald-500/20";

  const runUpdate = async (nextStatus: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await onUpdate(order.id, nextStatus);
    } catch (err: any) {
      console.error("Failed to update order status", err);
      posAlert.fire({
        toast: true,
        position: "top-end",
        timer: 2500,
        showConfirmButton: false,
        icon: "error",
        title: "No se pudo actualizar",
        text: err?.message || "Intenta de nuevo.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={`bg-[#1c1c1c] border rounded-2xl p-5 shadow-2xl transition-all ${
        isNew
          ? "border-primary/50 ring-1 ring-primary/20"
          : isProgress
            ? "border-[#f6e05e]/50 ring-1 ring-[#f6e05e]/20"
            : "border-emerald-400/30 ring-1 ring-emerald-400/10"
      } ${
        isHighlighted
          ? "ring-2 ring-primary/40 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.7)] animate-in zoom-in-95 fade-in duration-300"
          : ""
      }`}
    >
      <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-black text-white">
              {order.ticketNumber}
            </span>
            <Badge className="bg-[#242426] text-white hover:bg-[#242426] border-white/10">
              {isSalon
                ? typeof order?.table?.number === "number"
                  ? `Mesa ${order.table.number}`
                  : "Salón"
                : order.customerName || "Para Llevar"}
            </Badge>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3" /> hace{" "}
            {timeElapsed > 0 ? timeElapsed : "<1"} min
          </div>
        </div>

        <div
          className={`text-[12px] font-black px-3 py-1 rounded-full border ${ageClass}`}
          title="Tiempo desde que se creo el pedido"
        >
          {ageLabel}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {order.items?.map((item: any) => (
          <TicketItem
            key={item.id}
            qty={item.quantity}
            name={
              item.productName +
              (item.variantName ? ` (${item.variantName})` : "")
            }
            note={item.notes}
          />
        ))}
      </div>

      <div className="flex gap-2 pt-4 border-t border-white/5">
        {isNew && (
          <button
            onClick={() => runUpdate("PREPARING")}
            disabled={isUpdating}
            className="w-full py-3 rounded-xl bg-primary text-gray-900 font-bold shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                Actualizando <Loader2 className="w-4 h-4 animate-spin" />
              </>
            ) : (
              <>
                Iniciar Preparación <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}
        {order.status === "PREPARING" && (
          <button
            onClick={() => runUpdate("IN_OVEN")}
            disabled={isUpdating}
            className="w-full py-3 rounded-xl bg-[#dd6b20] text-white font-bold shadow-[0_0_15px_rgba(221,107,32,0.3)] hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                Actualizando <Loader2 className="w-4 h-4 animate-spin" />
              </>
            ) : (
              "Al Horno"
            )}
          </button>
        )}
        {order.status === "IN_OVEN" && (
          <button
            onClick={() => runUpdate("READY")}
            disabled={isUpdating}
            className="w-full py-3 rounded-xl bg-[#f6e05e] text-orange-950 font-bold shadow-[0_0_15px_rgba(246,224,94,0.3)] hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                Actualizando <Loader2 className="w-4 h-4 animate-spin" />
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" /> Marcar Listo
              </>
            )}
          </button>
        )}
        {isDone && (
          <button
            onClick={() => runUpdate("DELIVERED")}
            disabled={isUpdating}
            className="w-full py-3 rounded-xl border border-white/10 text-white font-bold bg-[#242426] hover:bg-[#2a2a2c] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                Actualizando <Loader2 className="w-4 h-4 animate-spin" />
              </>
            ) : (
              "Entregado (Quitar)"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function TicketItem({ qty, name, note }: any) {
  return (
    <div className="flex gap-3 group cursor-pointer">
      <span className="font-black text-white w-6 shrink-0">{qty}x</span>
      <div>
        <span className="font-bold text-sm text-gray-200">{name}</span>
        {note && (
          <p className="text-xs text-red-400 font-semibold mt-0.5 max-w-[90%]">
            Nota: {note}
          </p>
        )}
      </div>
    </div>
  );
}
