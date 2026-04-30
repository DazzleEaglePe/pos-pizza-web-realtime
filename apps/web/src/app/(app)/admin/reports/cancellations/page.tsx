"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useConfig } from "@/hooks/useConfig";
import { useTranslation } from "@/i18n";
import { isUnauthorized, handleSessionExpired } from "@/lib/api-error-handler";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { XCircle, ArrowLeft, AlertTriangle } from "lucide-react";
import { AdminPageHeader } from "@pos-pizza/ui";
import Link from "next/link";

interface Cancellation {
  orderId: string;
  ticketNumber: number;
  orderType: string;
  total: string;
  cancellationReason: string | null;
  cancelledByName: string | null;
  createdAt: string;
  updatedAt: string;
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function fmtMoney(v: number | string, symbol: string) {
  return `${symbol} ${Number(v || 0).toFixed(2)}`;
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function CancellationsPage() {
  const { t } = useTranslation();
  const cs = useConfig((s) => s.currencySymbol);

  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDate(d);
  });
  const [to, setTo] = useState(() => formatDate(new Date()));

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Cancellation[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const res = await apiFetch<Cancellation[]>(`/reports/cancellations?from=${from}&to=${to}`, { token });
      setData(res);
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      console.error("Failed to fetch cancellations", err);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading && data.length === 0) return <PageSkeleton variant="table" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        icon={<XCircle className="w-4 h-4 text-primary" />}
        title={t("reports.cancellations")}
        description={t("reports.cancellationsSubtitle")}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/reports"
              className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2 bg-muted/60 rounded-full px-4 py-2">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="bg-transparent text-sm font-medium outline-none w-[130px]"
              />
              <span className="text-muted-foreground text-xs">→</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="bg-transparent text-sm font-medium outline-none w-[130px]"
              />
            </div>
          </div>
        }
      />

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">{t("reports.ticket")}</th>
                  <th className="text-left px-4 py-3 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">{t("reports.type")}</th>
                  <th className="text-right px-4 py-3 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">{t("reports.total")}</th>
                  <th className="text-left px-4 py-3 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">{t("reports.reason")}</th>
                  <th className="text-left px-4 py-3 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">{t("reports.cancelledBy")}</th>
                  <th className="text-left px-4 py-3 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">{t("reports.date")}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.orderId} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold">#{c.ticketNumber}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-muted px-2.5 py-0.5 rounded-full font-bold">
                        {c.orderType === "DINE_IN" ? t("reports.dineIn") : t("reports.takeout")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{fmtMoney(c.total, cs)}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                      {c.cancellationReason || (
                        <span className="italic text-muted-foreground/50">{t("reports.noReason")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{c.cancelledByName || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{fmtDateTime(c.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <AlertTriangle className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">{t("reports.noCancellations")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
