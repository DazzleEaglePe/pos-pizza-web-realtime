"use client";

import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationListener() {
  const add = useNotifications((s) => s.add);

  useRealtimeOrders({
    onOrderCreated(order) {
      add({
        type: "order_created",
        title: `Nuevo pedido #${order.ticketNumber}`,
        body: order.customerName
          ? `${order.customerName} — ${order.orderType === "DINE_IN" ? "Salón" : "Para llevar"}`
          : order.orderType === "DINE_IN"
            ? "Salón"
            : "Para llevar",
      });
    },
    onOrderStatusUpdated(data) {
      const statusLabels: Record<string, string> = {
        RECEIVED: "Recibido",
        PREPARING: "En preparación",
        IN_OVEN: "En horno",
        READY: "Listo",
        DELIVERED: "Entregado",
      };
      add({
        type: "order_status",
        title: "Pedido actualizado",
        body: `Pedido → ${statusLabels[data.status] || data.status}`,
      });
    },
    onOrderCancelled(data) {
      add({
        type: "order_cancelled",
        title: "Pedido cancelado",
        body: `ID: ${data.orderId.slice(0, 8)}...`,
      });
    },
  });

  return null;
}
