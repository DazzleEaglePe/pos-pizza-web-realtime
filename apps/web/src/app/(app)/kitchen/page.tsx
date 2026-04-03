"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { API_URL } from "@/lib/config";
import { getAccessToken } from "@/lib/auth";
import { posAlert } from "@/lib/sweetalert";
import { isUnauthorized, handleSessionExpired } from "@/lib/api-error-handler";
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
        if (isUnauthorized(err)) { handleSessionExpired(); return; }
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
      <div className="p-6">
        <PageSkeleton variant="board" showHero={false} />
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
    <div className="flex flex-col w-[calc(100vw-2rem)] sm:w-90 lg:w-95 max-w-110 h-full min-h-0 shrink-0 snap-start">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-3">
          {title}{" "}
          <span className="text-sm bg-card text-primary px-3 py-1 rounded-full font-black border border-primary/20">
            {count}
          </span>
        </h2>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-4 pb-12">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground px-2 py-8">
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
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : ageTone === "warn"
        ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
        : ageTone === "ok"
          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
          : "bg-primary/10 text-primary border-primary/20";

  const runUpdate = async (nextStatus: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await onUpdate(order.id, nextStatus);
    } catch (err: any) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
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
      className={`bg-card border rounded-sm p-3.5 sm:p-5 shadow-lg transition-all ${
        isNew
          ? "border-primary/40 ring-1 ring-primary/10"
          : isProgress
            ? "border-amber-400/40 ring-1 ring-amber-400/10"
            : "border-emerald-500/30 ring-1 ring-emerald-500/10"
      } ${
        isHighlighted
          ? "ring-2 ring-primary/40 shadow-xl animate-in zoom-in-95 fade-in duration-300"
          : ""
      }`}
    >
        <div className="flex justify-between items-start mb-3 sm:mb-4 border-b border-border pb-3 sm:pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-black text-foreground">
              {order.ticketNumber}
            </span>
            <Badge className="bg-muted text-foreground hover:bg-muted border-border">
              {isSalon
                ? typeof order?.table?.number === "number"
                  ? `Mesa ${order.table.number}`
                  : "Salón"
                : order.customerName || "Para Llevar"}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
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

      <div className="space-y-2.5 mb-4 sm:mb-6">
        {order.items?.map((item: any) => (
          <TicketItem
            key={item.id}
            qty={item.quantity}
            name={
              item.productName +
              (item.variantName ? ` (${item.variantName})` : "")
            }
            modifierNames={item.modifierNames}
            note={item.notes}
          />
        ))}
      </div>

      <div className="flex gap-2 pt-3 sm:pt-4 border-t border-border">
        {isNew && (
          <button
            onClick={() => runUpdate("PREPARING")}
            disabled={isUpdating}
            className="w-full py-2.5 sm:py-3 rounded-sm bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
            className="w-full py-2.5 sm:py-3 rounded-xl bg-orange-600 text-white font-bold shadow-md hover:bg-orange-600/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
            className="w-full py-2.5 sm:py-3 rounded-xl bg-amber-400 text-amber-950 font-bold shadow-md hover:bg-amber-400/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
            className="w-full py-2.5 sm:py-3 rounded-sm border border-border text-foreground font-bold bg-muted hover:bg-accent transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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

function TicketItem({ qty, name, note, modifierNames }: any) {
  return (
    <div className="flex gap-3">
      <span className="font-black text-foreground w-6 shrink-0">{qty}x</span>
      <div className="min-w-0">
        <span className="font-bold text-sm text-foreground/80">{name}</span>
        {modifierNames?.length > 0 && (
          <p className="text-xs text-primary/80 font-semibold mt-0.5">
            + {modifierNames.join(", ")}
          </p>
        )}
        {note && (
          <p className="text-xs text-destructive font-semibold mt-0.5 truncate">
            📝 {note}
          </p>
        )}
      </div>
    </div>
  );
}
