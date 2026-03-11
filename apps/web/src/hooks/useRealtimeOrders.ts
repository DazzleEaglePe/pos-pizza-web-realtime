"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

interface OrderEvent {
  orderId: string;
  ticketNumber?: string;
  status?: string;
  total?: number;
  [key: string]: any;
}

type OrderEventHandler = (data: OrderEvent) => void;

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
  onOrderCreated?: OrderEventHandler;
  onOrderStatusUpdated?: OrderEventHandler;
  onOrderCancelled?: OrderEventHandler;
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
    socket.on("order:created", (data: OrderEvent) => {
      console.log("📦 order:created", data);
      handlers?.onOrderCreated?.(data);
    });

    socket.on("order:statusUpdated", (data: OrderEvent) => {
      console.log("🔄 order:statusUpdated", data);
      handlers?.onOrderStatusUpdated?.(data);
    });

    socket.on("order:cancelled", (data: OrderEvent) => {
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
   * Emit an order status update from the client (e.g., Kitchen updating status).
   */
  const updateOrderStatus = useCallback(
    (orderId: string, status: string) => {
      socketRef.current?.emit("order:updateStatus", { orderId, status });
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
    joinOrderRoom,
  };
}
