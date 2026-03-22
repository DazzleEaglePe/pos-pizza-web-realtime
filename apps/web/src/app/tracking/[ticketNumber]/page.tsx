"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleDashed,
  Pizza,
  ChevronLeft,
  Ticket,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { io } from "socket.io-client";
import { useParams } from "next/navigation";
import { API_URL, WS_URL } from "@/lib/config";
import { useTranslation } from "@/i18n";
import {
  AnimatedTrackingStep,
  AnimatedProgressBar,
  getEstimatedMinutes,
} from "@/components/tracking/tracking-animations";

type OrderStatus =
  | "RECEIVED"
  | "PREPARING"
  | "IN_OVEN"
  | "READY"
  | "DELIVERED"
  | "CANCELLED"
  | (string & {});

type TrackedOrderItem = {
  productName: string;
  quantity: number;
  subtotal: number;
  variantName?: string | null;
};

type StatusHistoryEntry = {
  status: OrderStatus;
  createdAt: string;
};

type TrackedOrder = {
  id: string;
  ticketNumber: string;
  status: OrderStatus;
  orderType?: "DINE_IN" | "TAKEOUT" | (string & {});
  customerName?: string | null;
  table?: { number: number; zone?: string | null } | null;
  createdAt: string;
  deliveredAt?: string | null;
  updatedAt?: string | null;
  total: number;
  items?: TrackedOrderItem[];
  statusHistory?: StatusHistoryEntry[];
};

type StatusUpdatedEvent = {
  orderId: string;
  status: OrderStatus;
  updatedAt?: string;
  deliveredAt?: string;
};

export default function TrackingTicketPage() {
  const params = useParams();
  const ticketNumber = params.ticketNumber as string;

  const { t, locale, setLocale } = useTranslation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const lang = new URLSearchParams(window.location.search).get("lang");
    if (lang === "en" || lang === "es") setLocale(lang);
  }, [setLocale]);

  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWsConnected, setIsWsConnected] = useState(false);

  const timeLocale = locale === "en" ? "en-US" : "es-PE";

  const STATUS_STEPS = [
    {
      key: "RECEIVED",
      title: t("tracking.steps.RECEIVED.title"),
      desc: t("tracking.steps.RECEIVED.desc"),
    },
    {
      key: "PREPARING",
      title: t("tracking.steps.PREPARING.title"),
      desc: t("tracking.steps.PREPARING.desc"),
    },
    {
      key: "IN_OVEN",
      title: t("tracking.steps.IN_OVEN.title"),
      desc: t("tracking.steps.IN_OVEN.desc"),
    },
    {
      key: "READY",
      title: t("tracking.steps.READY.title"),
      desc: t("tracking.steps.READY.desc"),
    },
    {
      key: "DELIVERED",
      title: t("tracking.steps.DELIVERED.title"),
      desc: t("tracking.steps.DELIVERED.desc"),
    },
  ] as const;

  // 1. Fetch initial order data via REST
  useEffect(() => {
    if (!ticketNumber) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`${API_URL}/orders/track/${ticketNumber}`)
      .then((res) => {
        if (!res.ok) throw new Error("ORDER_NOT_FOUND");
        return res.json();
      })
      .then((data) => {
        setOrder(data as TrackedOrder);
        setError(null);
      })
      .catch((err) => setError(err?.message || "errors.generic"))
      .finally(() => setLoading(false));
  }, [ticketNumber]);

  // 2. Connect WebSocket for real-time updates
  useEffect(() => {
    if (!order) return;

    const socket = io(`${WS_URL}/pos`, { transports: ["websocket"] });

    socket.on("connect", () => {
      setIsWsConnected(true);
      socket.emit("order:join", { orderId: order.id });
    });

    socket.on("disconnect", () => {
      setIsWsConnected(false);
    });

    socket.on("order:statusUpdated", (data: StatusUpdatedEvent) => {
      if (data.orderId === order.id) {
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                status: data.status,
                ...(data.updatedAt ? { updatedAt: data.updatedAt } : {}),
                ...(data.deliveredAt ? { deliveredAt: data.deliveredAt } : {}),
                statusHistory: (() => {
                  const prevHistory = Array.isArray(prev.statusHistory)
                    ? prev.statusHistory
                    : [];

                  const ts =
                    data.deliveredAt ||
                    data.updatedAt ||
                    new Date().toISOString();

                  const exists = prevHistory.some(
                    (h) => String(h?.status) === String(data.status),
                  );
                  if (exists) return prevHistory;

                  return [
                    ...prevHistory,
                    { status: data.status, createdAt: ts },
                  ];
                })(),
              }
            : prev,
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [order?.id]);

  const statusKey = String(order?.status || "");
  const statusLabelMap: Record<string, string> = {
    RECEIVED: t("tracking.status.RECEIVED"),
    PREPARING: t("tracking.status.PREPARING"),
    IN_OVEN: t("tracking.status.IN_OVEN"),
    READY: t("tracking.status.READY"),
    DELIVERED: t("tracking.status.DELIVERED"),
    CANCELLED: t("tracking.status.CANCELLED"),
  };
  const statusLabel: string = statusLabelMap[statusKey] || statusKey;

  const statusTone: "warn" | "done" | "bad" =
    statusKey === "DELIVERED"
      ? "done"
      : statusKey === "READY"
        ? "done"
        : statusKey === "CANCELLED"
          ? "bad"
          : "warn";

  const statusClass =
    statusTone === "done"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
      : statusTone === "bad"
        ? "bg-red-500/10 text-red-700 border-red-200"
        : "bg-primary/10 text-primary border-primary/20";

  // Compute step index
  const rawStepIndex = order
    ? STATUS_STEPS.findIndex((s) => s.key === order.status)
    : -1;
  const currentStepIndex = rawStepIndex === -1 ? 0 : rawStepIndex;
  const progressPercent = order
    ? Math.min((currentStepIndex / (STATUS_STEPS.length - 1)) * 100, 100)
    : 0;

  const historyArr = Array.isArray(order?.statusHistory)
    ? order.statusHistory
    : [];
  const historyByStatus = new Map<string, string>();
  for (const h of historyArr) {
    const k = String(h?.status || "");
    const v = h?.createdAt ? String(h.createdAt) : "";
    if (!k || !v) continue;
    historyByStatus.set(k, v);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="mt-4 text-muted-foreground font-medium">
          {t("tracking.searching")}
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6 text-center">
        <Pizza className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h1 className="text-2xl font-black text-foreground mb-2">
          {t("tracking.notFoundTitle")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("tracking.notFoundText", { ticket: ticketNumber })}
        </p>
        <Link
          href="/tracking"
          className="mt-6 text-primary font-bold text-sm underline"
        >
          {t("common.back")}
        </Link>
      </div>
    );
  }

  if (order.status === "CANCELLED") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6 text-center">
        <Pizza className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h1 className="text-2xl font-black text-foreground mb-2">
          {t("tracking.cancelledTitle")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("tracking.cancelledText", { ticket: ticketNumber })}
        </p>
        <Link
          href="/tracking"
          className="mt-6 text-primary font-bold text-sm underline"
        >
          {t("common.back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh w-full bg-background text-foreground relative overflow-hidden">
      <div className="absolute top-0 right-0 w-140 h-140 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-115 h-115 bg-primary/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/tracking"
              className="w-10 h-10 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label={t("common.back")}
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>

            <Link
              href="/tracking"
              className="flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <div className="w-11 h-11 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center">
                <Pizza className="w-5 h-5 text-primary" />
              </div>
              <div className="hidden sm:block">
                <div className="font-black text-foreground leading-none tracking-tight">
                  {t("common.appName")}
                </div>
                <div className="text-xs font-bold text-muted-foreground mt-1">
                  {t("tracking.brandSubtitle")}
                </div>
              </div>
            </Link>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-muted-foreground">
            {t("cart.ticketLabel")}{" "}
            <span className="text-foreground font-black">
              {order.ticketNumber}
            </span>
          </div>
        </header>

        <main className="mt-8">
          <div className="bg-card rounded-[2rem] p-6 sm:p-7 border border-border shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight">
                  {order.ticketNumber}
                </h1>
                <p className="text-muted-foreground mt-2 font-medium">
                  {t("tracking.placedAt")}:{" "}
                  <span className="font-bold text-primary">
                    {new Date(order.createdAt).toLocaleTimeString(timeLocale, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </p>

                <p className="text-muted-foreground mt-1 font-medium">
                  {order?.orderType === "DINE_IN" && order?.table
                    ? `${t("cart.table")} ${order.table.number}${order.table.zone ? ` (${order.table.zone})` : ""}`
                    : order?.customerName
                      ? `${t("cart.takeout")}: ${order.customerName}`
                      : t("cart.takeout")}
                </p>

                {order.status === "DELIVERED" && order.deliveredAt && (
                  <p className="text-muted-foreground mt-1 font-medium">
                    {t("tracking.deliveredAt")}:{" "}
                    <span className="font-bold text-foreground">
                      {new Date(order.deliveredAt).toLocaleTimeString(
                        timeLocale,
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 sm:justify-end">
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full border text-xs font-black tracking-wide ${statusClass}`}
                >
                  {statusLabel}
                </span>

                <span className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isWsConnected ? "bg-emerald-400" : "bg-muted-foreground/30"
                    }`}
                    aria-hidden
                  />
                  {isWsConnected ? t("tracking.live") : t("tracking.offline")}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:gap-8 items-start">
            {/* Stepper */}
            <div className="lg:col-span-7 lg:sticky lg:top-6 lg:self-start">
              <div className="bg-card rounded-[2rem] p-6 sm:p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] w-full relative">
                <div className="absolute top-10 sm:top-12 bottom-10 sm:bottom-12 left-10 sm:left-13 w-1 bg-border/50 -translate-x-1/2 rounded-full z-0" />
                <AnimatedProgressBar percent={progressPercent} />

                <div className="space-y-10 sm:space-y-12 relative z-10">
                  {STATUS_STEPS.map((step, idx) => {
                    let stepStatus: "done" | "active" | "pending" = "pending";
                    if (idx < currentStepIndex) stepStatus = "done";
                    else if (idx === currentStepIndex) stepStatus = "active";

                    const ts = historyByStatus.get(step.key);
                    const time = ts
                      ? new Date(ts).toLocaleTimeString(timeLocale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : stepStatus === "active"
                        ? t("tracking.inProgress")
                        : "--:--";

                    const estMinutes = stepStatus === "active" ? getEstimatedMinutes(step.key) : 0;
                    const estimatedLabel =
                      estMinutes > 0
                        ? t("tracking.estimatedMinutes", { min: String(estMinutes) })
                        : undefined;

                    return (
                      <AnimatedTrackingStep
                        key={step.key}
                        stepKey={step.key}
                        status={stepStatus}
                        title={step.title}
                        time={time}
                        desc={step.desc}
                        index={idx}
                        estimatedLabel={estimatedLabel}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Receipt */}
            <div className="lg:col-span-5">
              <div className="bg-card rounded-3xl p-5 sm:p-6 shadow-sm border border-border">
                <div className="flex items-center gap-2 font-bold text-foreground border-b border-border pb-4 mb-4">
                  <Ticket className="w-5 h-5 text-primary" />
                  <h3>{t("tracking.orderSummary")}</h3>
                </div>

                <div className="space-y-3 mb-6">
                  {Array.isArray(order.items) &&
                    order.items.map((item, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between font-semibold text-[15px] text-foreground/70"
                      >
                        <span>
                          {item.quantity}x {item.productName}
                        </span>
                        <span>S/ {Number(item.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                </div>

                <div className="flex justify-between font-black text-lg text-foreground pt-4 border-t border-dashed border-border">
                  <span>{t("tracking.total")}</span>
                  <span>S/ {Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// TrackingStep is now handled by AnimatedTrackingStep from tracking-animations
