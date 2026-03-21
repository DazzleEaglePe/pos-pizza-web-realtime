"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useConfig } from "@/hooks/useConfig";
import { useTranslation } from "@/i18n";
import { isUnauthorized, handleSessionExpired } from "@/lib/api-error-handler";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import {
  BarChart3,
  TrendingUp,
  Receipt,
  DollarSign,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  CreditCard,
  Banknote,
  XCircle,
  FileDown,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

/* ─── Types ───────────────────────────────────────────── */

interface SalesSummary {
  totalSales: number;
  totalOrders: number;
  avgTicket: number;
  totalTax: number;
  totalCancelled: number;
  paymentBreakdown: { method: string; total: number; count: number }[];
  daily?: { date: string; totalSales: string; totalOrders: string; avgTicket: string }[];
}

interface TopProduct {
  productId: string;
  productName: string;
  totalQty: string;
  totalRevenue: string;
}

interface CategorySale {
  categoryId: string;
  categoryName: string;
  totalSales: string;
  totalQty: string;
}

interface TypeSale {
  orderType: string;
  totalSales: string;
  totalOrders: string;
}

/* ─── Helpers ─────────────────────────────────────────── */

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function fmtMoney(v: number | string, symbol: string) {
  return `${symbol} ${Number(v || 0).toFixed(2)}`;
}

const PIE_COLORS = ["hsl(142, 71%, 45%)", "hsl(217, 91%, 60%)", "hsl(45, 93%, 47%)", "hsl(0, 84%, 60%)"];

/* ─── Component ───────────────────────────────────────── */

export default function ReportsPage() {
  const { t } = useTranslation();
  const cs = useConfig((s) => s.currencySymbol);

  // Date range (default: last 7 days)
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return formatDate(d);
  });
  const [to, setTo] = useState(() => formatDate(new Date()));

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [byCategory, setByCategory] = useState<CategorySale[]>([]);
  const [byType, setByType] = useState<TypeSale[]>([]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const opts = { token };
      const [salesData, topData, catData, typeData] = await Promise.all([
        apiFetch<SalesSummary>(`/reports/sales?from=${from}&to=${to}`, opts),
        apiFetch<TopProduct[]>(`/reports/top-products?from=${from}&to=${to}&limit=10`, opts),
        apiFetch<CategorySale[]>(`/reports/sales/by-category?from=${from}&to=${to}`, opts),
        apiFetch<TypeSale[]>(`/reports/sales/by-type?from=${from}&to=${to}`, opts),
      ]);
      setSummary(salesData);
      setTopProducts(topData);
      setByCategory(catData);
      setByType(typeData);
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      console.error("Failed to fetch reports", err);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  if (loading && !summary) return <PageSkeleton variant="cards" cards={8} />;

  /* ─── Derived data ────────────────────────────────── */
  const dailyChart =
    summary?.daily?.map((d) => ({
      date: d.date.slice(5), // MM-DD
      ventas: Number(d.totalSales || 0),
      pedidos: Number(d.totalOrders || 0),
    })) ?? [];

  const paymentPie =
    summary?.paymentBreakdown?.map((p) => ({
      name: p.method === "CASH" ? t("reports.cash") : p.method === "DIGITAL" ? t("reports.digital") : p.method,
      value: p.total,
    })) ?? [];

  const typePie = byType.map((t2) => ({
    name: t2.orderType === "DINE_IN" ? t("reports.dineIn") : t("reports.takeout"),
    value: Number(t2.totalSales || 0),
  }));

  const totalCatSales = byCategory.reduce((a, c) => a + Number(c.totalSales || 0), 0);

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            {t("reports.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("reports.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-3 py-1.5">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
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
          <ExportDropdown from={from} to={to} />
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={DollarSign}
          label={t("reports.totalSales")}
          value={fmtMoney(summary?.totalSales ?? 0, cs)}
          accent="text-primary"
        />
        <SummaryCard
          icon={Receipt}
          label={t("reports.totalOrders")}
          value={String(summary?.totalOrders ?? 0)}
          accent="text-blue-500"
        />
        <SummaryCard
          icon={TrendingUp}
          label={t("reports.avgTicket")}
          value={fmtMoney(summary?.avgTicket ?? 0, cs)}
          accent="text-amber-500"
        />
        <SummaryCard
          icon={XCircle}
          label={t("reports.cancelled")}
          value={String(summary?.totalCancelled ?? 0)}
          accent="text-destructive"
        />
      </div>

      {/* ── Area Chart: Daily Sales ── */}
      {dailyChart.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4 text-foreground">{t("reports.dailyTrend")}</h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChart}>
                <defs>
                  <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: ValueType | undefined) => [fmtMoney(Number(v ?? 0), cs), t("reports.totalSales")]}
                />
                <Area
                  type="monotone"
                  dataKey="ventas"
                  stroke="hsl(142, 71%, 45%)"
                  strokeWidth={2}
                  fill="url(#gradSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Row: Payment Pie + Type Pie + Top Products ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Payment method pie */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-3 text-foreground">{t("reports.byPaymentMethod")}</h2>
          {paymentPie.length > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {paymentPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: ValueType | undefined) => fmtMoney(Number(v ?? 0), cs)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">{t("reports.noData")}</p>
          )}
          <div className="flex justify-center gap-4 mt-2">
            {paymentPie.map((p, i) => (
              <div key={p.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                {p.name}
              </div>
            ))}
          </div>
        </div>

        {/* Order type pie */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-3 text-foreground">{t("reports.byOrderType")}</h2>
          {typePie.length > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typePie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    <Cell fill="hsl(142, 71%, 45%)" />
                    <Cell fill="hsl(217, 91%, 60%)" />
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: ValueType | undefined) => fmtMoney(Number(v ?? 0), cs)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">{t("reports.noData")}</p>
          )}
          <div className="flex justify-center gap-4 mt-2">
            {typePie.map((p, i) => (
              <div key={p.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: i === 0 ? "hsl(142, 71%, 45%)" : "hsl(217, 91%, 60%)" }} />
                {p.name}
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-3 text-foreground">{t("reports.topProducts")}</h2>
          {topProducts.length > 0 ? (
            <div className="space-y-2.5 max-h-[250px] overflow-y-auto custom-scrollbar">
              {topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${i < 3 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.productName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {Number(p.totalQty)} {t("reports.unitsSold")} · {fmtMoney(p.totalRevenue, cs)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">{t("reports.noData")}</p>
          )}
        </div>
      </div>

      {/* ── Category Breakdown ── */}
      {byCategory.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4 text-foreground">{t("reports.byCategory")}</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory.map((c) => ({ name: c.categoryName, ventas: Number(c.totalSales || 0) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: ValueType | undefined) => [fmtMoney(Number(v ?? 0), cs), t("reports.totalSales")]}
                />
                <Bar dataKey="ventas" fill="hsl(142, 71%, 45%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Summary Card ────────────────────────────────────── */

function SummaryCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-lg font-bold tracking-tight mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/* ─── Export Dropdown ─────────────────────────────────── */

function ExportDropdown({ from, to }: { from: string; to: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const download = (path: string) => {
    const token = getAccessToken();
    const url = `${API_URL}${path}?from=${from}&to=${to}`;
    const a = document.createElement("a");
    // Use a hidden fetch so we can send the auth header
    void fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        a.href = URL.createObjectURL(blob);
        a.download = path.split("/").pop() + (path.includes("pdf") ? ".pdf" : ".xlsx");
        a.click();
        URL.revokeObjectURL(a.href);
      });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <FileDown className="w-4 h-4" />
        Exportar
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-52 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
          <button onClick={() => download("/reports/export/sales/pdf")} className="w-full px-3 py-2 text-sm text-left hover:bg-muted">
            Ventas — PDF
          </button>
          <button onClick={() => download("/reports/export/sales/excel")} className="w-full px-3 py-2 text-sm text-left hover:bg-muted">
            Ventas — Excel
          </button>
          <button onClick={() => download("/reports/export/top-products/pdf")} className="w-full px-3 py-2 text-sm text-left hover:bg-muted">
            Top Productos — PDF
          </button>
          <button onClick={() => download("/reports/export/top-products/excel")} className="w-full px-3 py-2 text-sm text-left hover:bg-muted">
            Top Productos — Excel
          </button>
        </div>
      )}
    </div>
  );
}
