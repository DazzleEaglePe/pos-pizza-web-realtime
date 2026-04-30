"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Package, ArrowRightLeft, XCircle, CheckCheck } from "lucide-react";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { useTranslation } from "@/i18n";

function timeAgo(ts: number, justNowLabel: string): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return justNowLabel;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const ICON_MAP: Record<Notification["type"], typeof Package> = {
  order_created: Package,
  order_status: ArrowRightLeft,
  order_cancelled: XCircle,
  info: Bell,
};

const COLOR_MAP: Record<Notification["type"], string> = {
  order_created: "text-primary bg-primary/10",
  order_status: "text-blue-500 bg-blue-500/10",
  order_cancelled: "text-destructive bg-destructive/10",
  info: "text-muted-foreground bg-muted",
};

export function NotificationBell() {
  const { t } = useTranslation();
  const { items, unreadCount, markAllRead, fetchInitial } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          const willOpen = !open;
          setOpen(willOpen);
          if (willOpen) {
            fetchInitial();
            if (unreadCount > 0) markAllRead();
          }
        }}
        className="relative p-2 h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
      >
        <Bell className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1 border-2 border-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 sm:top-12 w-[min(22rem,calc(100vw-1rem))] sm:w-80 bg-card border border-border rounded-sm shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-bold text-sm">{t("notifications.title")}</h3>
            {items.length > 0 && (
              <button
                onClick={() => markAllRead()}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
            {items.length > 0 ? (
              items.map((n) => {
                const Icon = ICON_MAP[n.type];
                return (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors ${!n.read ? "bg-primary/[0.03]" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${COLOR_MAP[n.type]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5">
                      {timeAgo(n.timestamp, t("notifications.justNow"))}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("notifications.empty")}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
