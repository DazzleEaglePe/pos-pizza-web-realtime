"use client";

import { create } from "zustand";
import { apiFetch } from "@/lib/api";

export interface Notification {
  id: string;
  type: "order_created" | "order_status" | "order_cancelled" | "info";
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
}

interface NotificationState {
  items: Notification[];
  unreadCount: number;
  fetched: boolean;
  add: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAllRead: () => void;
  clear: () => void;
  fetchInitial: () => Promise<void>;
}

export const useNotifications = create<NotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,
  fetched: false,

  add(n) {
    const item: Notification = {
      ...n,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      read: false,
    };
    set((s) => ({
      items: [item, ...s.items].slice(0, 50),
      unreadCount: s.unreadCount + 1,
    }));
  },

  async markAllRead() {
    set((s) => ({
      items: s.items.map((i) => ({ ...i, read: true })),
      unreadCount: 0,
    }));
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH" });
    } catch {
      // local state already updated — silent fail
    }
  },

  clear() {
    set({ items: [], unreadCount: 0, fetched: false });
  },

  async fetchInitial() {
    if (get().fetched) return;
    try {
      const [listRes, countRes] = await Promise.all([
        apiFetch("/notifications?limit=50"),
        apiFetch("/notifications/unread-count"),
      ]);
      const list = await listRes.json();
      const countData = await countRes.json();

      const mapped: Notification[] = (list.data ?? []).map((n: any) => ({
        id: n.id,
        type: n.type ?? "info",
        title: n.title,
        body: n.message,
        timestamp: new Date(n.createdAt).getTime(),
        read: n.isRead,
      }));

      set({
        items: mapped,
        unreadCount: countData.count ?? 0,
        fetched: true,
      });
    } catch {
      // Silently fail — WS notifications still work
    }
  },
}));
