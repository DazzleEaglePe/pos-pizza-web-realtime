"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { WS_URL } from "@/lib/config";
import { apiFetch } from "@/lib/api";

export interface RealtimeOrderItem {
  id: string;
  productName: string;
  variantName?: string | null;
  quantity: number;
  notes?: string | null;
}

export interface RealtimeTable {
  number: number;
  zone?: string | null;
}

export interface RealtimeOrder {
  id: string;
  ticketNumber: string;
  status: string;
  orderType?: string;
  tableId?: string | null;
  table?: RealtimeTable | null;
  customerName?: string | null;
  subtotal?: number;
  taxAmount?: number;
  total?: number;
  createdAt?: string;
  updatedAt?: string;
  deliveredAt?: string;
  items?: RealtimeOrderItem[];
}

export interface OrderStatusUpdatedEvent {
  orderId: string;
  status: string;
  updatedAt?: string;
  deliveredAt?: string;
}

export interface OrderCancelledEvent {
  orderId: string;
}

/**
 * useRealtimeOrders — connects to the NestJS WebSocket gateway
 * on the /pos namespace and listens for real-time order events.
 *
 * Usage:
 * ```tsx
 * useRealtimeOrders({
 *   onOrderCreated: (order) => console.log("New order!", order),
 *   onOrderStatusUpdated: ({ orderId, status }) => console.log(orderId, status),
 *   onOrderCancelled: ({ orderId }) => console.log("Cancelled", orderId),
 * });
 * ```
 */
export function useRealtimeOrders(handlers?: {
  onOrderCreated?: (order: RealtimeOrder) => void;
  onOrderStatusUpdated?: (data: OrderStatusUpdatedEvent) => void;
  onOrderCancelled?: (data: OrderCancelledEvent) => void;
}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(`${WS_URL}/pos`, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 WebSocket connected:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("🔴 WebSocket disconnected");
      setIsConnected(false);
    });

    // ─── Order lifecycle events ────────────────────
    socket.on("order:created", (data: RealtimeOrder) => {
      console.log("📦 order:created", data);
      handlers?.onOrderCreated?.(data);
    });

    socket.on("order:statusUpdated", (data: OrderStatusUpdatedEvent) => {
      console.log("🔄 order:statusUpdated", data);
      handlers?.onOrderStatusUpdated?.(data);
    });

    socket.on("order:cancelled", (data: OrderCancelledEvent) => {
      console.log("❌ order:cancelled", data);
      handlers?.onOrderCancelled?.(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Persist an order status update via REST (Kitchen workflow).
   */
  const updateOrderStatus = useCallback(
    async (orderId: string, status: string) => {
      return await apiFetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    [],
  );

  const cancelOrder = useCallback(
    async (orderId: string, reason?: string | null) => {
      return await apiFetch(`/orders/${orderId}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ reason: reason || null }),
      });
    },
    [],
  );

  /**
   * Join a specific order room for targeted updates (e.g., tracking page).
   */
  const joinOrderRoom = useCallback((orderId: string) => {
    socketRef.current?.emit("order:join", { orderId });
  }, []);

  return {
    isConnected,
    socket: socketRef,
    updateOrderStatus,
    cancelOrder,
    joinOrderRoom,
  };
}
