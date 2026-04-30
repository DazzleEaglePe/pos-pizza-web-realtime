"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useConfig } from "@/hooks/useConfig";
import { isUnauthorized, handleSessionExpired } from "@/lib/api-error-handler";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import {
  Wallet,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";
import { AdminPageHeader } from "@pos-pizza/ui";

/* ─── Types ───────────────────────────────────────────── */

interface CashRegisterEntry {
  id: string;
  openingAmount: string;
  closingAmount: string | null;
  totalSales: string | null;
  totalCash: string | null;
  totalDigital: string | null;
  expectedCash: string | null;
  difference: string | null;
  totalTickets: number | null;
  status: string;
  openedAt: string;
  closedAt: string | null;
  userName: string | null;
}

interface HistoryResponse {
  data: CashRegisterEntry[];
  total: number;
  page: number;
  limit: number;
}

/* ─── Helpers ─────────────────────────────────────────── */

function fmtMoney(v: number | string | null, symbol: string) {
  return `${symbol} ${Number(v || 0).toFixed(2)}`;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateInput(d: Date) {
  return d.toISOString().split("T")[0];
}

/* ─── Component ───────────────────────────────────────── */

export default function CashRegisterHistoryPage() {
  const cs = useConfig((s) => s.currencySymbol);

  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateInput(d);
  });
  const [to, setTo] = useState(() => formatDateInput(new Date()));

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CashRegisterEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 15;

  const [detail, setDetail] = useState<CashRegisterEntry | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const resp = await apiFetch<HistoryResponse>(
        `/cash-register/history?from=${from}&to=${to}&page=${page}&limit=${limit}`,
        { token },
      );
      setData(resp.data);
      setTotal(resp.total);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleSessionExpired();
        return;
      }
      console.error("Failed to fetch cash register history", err);
    } finally {
      setLoading(false);
    }
  }, [from, to, page]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const totalPages = Math.ceil(total / limit) || 1;

  if (loading && data.length === 0) return <PageSkeleton variant="cards" cards={6} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        icon={<Wallet className="w-4 h-4 text-primary" />}
        title="Historial de Caja"
        description="Registro de aperturas y cierres de caja"
        actions={
          <div className="flex items-center gap-2 bg-muted/60 rounded-full px-4 py-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              className="bg-transparent text-sm font-medium outline-none w-[130px]"
            />
            <span className="text-muted-foreground text-xs">→</span>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1); }}
              className="bg-transparent text-sm font-medium outline-none w-[130px]"
            />
          </div>
        }
      />

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Usuario</th>
                <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Apertura</th>
                <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Cierre</th>
                <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider text-muted-foreground text-right">Ventas</th>
                <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider text-muted-foreground text-right">Diferencia</th>
                <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider text-muted-foreground text-center">Tickets</th>
                <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider text-muted-foreground text-center">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    No hay registros para este período.
                  </td>
                </tr>
              ) : (
                data.map((r) => {
                  const diff = Number(r.difference || 0);
                  return (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{r.userName ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(r.openedAt)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(r.closedAt)}</td>
                      <td className="px-4 py-3 text-right font-medium">{fmtMoney(r.totalSales, cs)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${diff < 0 ? "text-red-500" : diff > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                        {diff > 0 ? "+" : ""}{fmtMoney(diff, cs)}
                      </td>
                      <td className="px-4 py-3 text-center">{r.totalTickets ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setDetail(r)}
                          className="p-1.5 rounded-md hover:bg-accent transition-colors"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">
            {total} registros · Página {page} de {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-md hover:bg-accent disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-md hover:bg-accent disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">Detalle de Caja</h2>
              <button onClick={() => setDetail(null)} className="p-1 rounded-md hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Operador</p>
                <p className="font-medium">{detail.userName ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Estado</p>
                <p className="font-medium">{detail.status}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Apertura</p>
                <p className="font-medium">{fmtDate(detail.openedAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Cierre</p>
                <p className="font-medium">{fmtDate(detail.closedAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Monto apertura</p>
                <p className="font-medium">{fmtMoney(detail.openingAmount, cs)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Monto cierre</p>
                <p className="font-medium">{fmtMoney(detail.closingAmount, cs)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Ventas totales</p>
                <p className="font-medium">{fmtMoney(detail.totalSales, cs)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Tickets</p>
                <p className="font-medium">{detail.totalTickets ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Efectivo</p>
                <p className="font-medium">{fmtMoney(detail.totalCash, cs)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Digital</p>
                <p className="font-medium">{fmtMoney(detail.totalDigital, cs)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Efectivo esperado</p>
                <p className="font-medium">{fmtMoney(detail.expectedCash, cs)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Diferencia</p>
                <p className={`font-semibold ${Number(detail.difference || 0) < 0 ? "text-red-500" : Number(detail.difference || 0) > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                  {fmtMoney(detail.difference, cs)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
