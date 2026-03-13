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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f7f9]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="mt-4 text-gray-500 font-medium">
          {t("tracking.searching")}
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f7f9] px-6 text-center">
        <Pizza className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-black text-gray-800 mb-2">
          {t("tracking.notFoundTitle")}
        </h1>
        <p className="text-gray-500 text-sm">
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f7f9] px-6 text-center">
        <Pizza className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-black text-gray-800 mb-2">
          {t("tracking.cancelledTitle")}
        </h1>
        <p className="text-gray-500 text-sm">
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
    <div className="min-h-[100dvh] w-full bg-[#f5f7f9] text-slate-800 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[560px] h-[560px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[460px] h-[460px] bg-primary/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/tracking"
              className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-500 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label={t("common.back")}
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>

            <Link
              href="/tracking"
              className="flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <div className="w-11 h-11 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                <Pizza className="w-5 h-5 text-primary" />
              </div>
              <div className="hidden sm:block">
                <div className="font-black text-gray-900 leading-none tracking-tight">
                  {t("common.appName")}
                </div>
                <div className="text-xs font-bold text-gray-500 mt-1">
                  {t("tracking.brandSubtitle")}
                </div>
              </div>
            </Link>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-gray-500">
            {t("cart.ticketLabel")}{" "}
            <span className="text-gray-900 font-black">
              {order.ticketNumber}
            </span>
          </div>
        </header>

        <main className="mt-8">
          <div className="bg-white rounded-[2rem] p-6 sm:p-7 border border-gray-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                  {order.ticketNumber}
                </h1>
                <p className="text-gray-500 mt-2 font-medium">
                  {t("tracking.placedAt")}:{" "}
                  <span className="font-bold text-primary">
                    {new Date(order.createdAt).toLocaleTimeString(timeLocale, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </p>

                <p className="text-gray-500 mt-1 font-medium">
                  {order?.orderType === "DINE_IN" && order?.table
                    ? `${t("cart.table")} ${order.table.number}${order.table.zone ? ` (${order.table.zone})` : ""}`
                    : order?.customerName
                      ? `${t("cart.takeout")}: ${order.customerName}`
                      : t("cart.takeout")}
                </p>

                {order.status === "DELIVERED" && order.deliveredAt && (
                  <p className="text-gray-500 mt-1 font-medium">
                    {t("tracking.deliveredAt")}:{" "}
                    <span className="font-bold text-gray-900">
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

                <span className="inline-flex items-center gap-2 text-xs font-bold text-gray-500">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isWsConnected ? "bg-emerald-400" : "bg-gray-300"
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
              <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] w-full relative">
                <div className="absolute top-10 sm:top-12 bottom-10 sm:bottom-12 left-[2.5rem] sm:left-[3.25rem] w-1 bg-gray-100/50 -translate-x-1/2 rounded-full z-0" />
                <div
                  className="absolute top-10 sm:top-12 bottom-10 sm:bottom-12 left-[2.5rem] sm:left-[3.25rem] w-1 bg-primary -translate-x-1/2 rounded-full z-0 transition-all duration-700 ease-in-out"
                  style={{ height: `${progressPercent}%` }}
                />

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

                    return (
                      <TrackingStep
                        key={step.key}
                        status={stepStatus}
                        title={step.title}
                        time={time}
                        desc={step.desc}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Receipt */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 font-bold text-gray-900 border-b border-gray-100 pb-4 mb-4">
                  <Ticket className="w-5 h-5 text-primary" />
                  <h3>{t("tracking.orderSummary")}</h3>
                </div>

                <div className="space-y-3 mb-6">
                  {Array.isArray(order.items) &&
                    order.items.map((item, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between font-semibold text-[15px] text-gray-700"
                      >
                        <span>
                          {item.quantity}x {item.productName}
                        </span>
                        <span>S/ {Number(item.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                </div>

                <div className="flex justify-between font-black text-lg text-gray-900 pt-4 border-t border-dashed border-gray-200">
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

function TrackingStep({
  status,
  title,
  time,
  desc,
}: {
  status: "done" | "active" | "pending";
  title: string;
  time: string;
  desc: string;
}) {
  const isDone = status === "done";
  const isActive = status === "active";
  const isPending = status === "pending";

  return (
    <div className="flex gap-5 sm:gap-6 w-full group">
      <div className="relative shrink-0 flex items-center justify-center pt-1">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10 transition-all duration-500
               ${isDone ? "bg-primary text-white" : isActive ? "bg-white border-primary shadow-[0_0_15px_rgba(0,191,166,0.3)]" : "bg-gray-100 border-gray-50 text-gray-300"}`}
        >
          {isDone && <CheckCircle2 className="w-5 h-5 text-white" />}
          {isActive && (
            <div className="w-3 h-3 bg-primary rounded-full animate-ping absolute"></div>
          )}
          {isActive && (
            <div className="w-3 h-3 bg-primary rounded-full relative z-10"></div>
          )}
          {isPending && <CircleDashed className="w-5 h-5 stroke-[3]" />}
        </div>
      </div>

      <div
        className={`flex flex-col pt-0.5 transition-opacity duration-500 ${isPending ? "opacity-50" : "opacity-100"}`}
      >
        <h4
          className={`text-lg tracking-tight font-black leading-none ${isActive ? "text-primary" : "text-gray-900"}`}
        >
          {title}
        </h4>
        <span
          className={`text-[13px] font-bold mt-1.5 ${isActive ? "text-gray-900" : "text-gray-400"}`}
        >
          {time}
        </span>
        <p className="text-sm font-medium text-gray-500 mt-1.5 leading-snug pr-4">
          {desc}
        </p>
      </div>
    </div>
  );
}
