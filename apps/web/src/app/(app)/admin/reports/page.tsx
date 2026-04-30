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
import { AdminPageHeader, AdminStatCard } from "@pos-pizza/ui";
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

const PIE_COLORS = ["var(--color-foreground)", "oklch(0.55 0 0)", "oklch(0.40 0 0)", "oklch(0.70 0 0)"];

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
      <AdminPageHeader
        icon={<BarChart3 className="w-4 h-4 text-primary" />}
        title={t("reports.title")}
        description={t("reports.subtitle")}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-muted/60 rounded-full px-4 py-2">
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
        }
      />

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          icon={<DollarSign className="w-4 h-4 text-foreground/70" />}
          label={t("reports.totalSales")}
          value={fmtMoney(summary?.totalSales ?? 0, cs)}
        />
        <AdminStatCard
          icon={<Receipt className="w-4 h-4 text-foreground/70" />}
          label={t("reports.totalOrders")}
          value={String(summary?.totalOrders ?? 0)}
        />
        <AdminStatCard
          icon={<TrendingUp className="w-4 h-4 text-foreground/70" />}
          label={t("reports.avgTicket")}
          value={fmtMoney(summary?.avgTicket ?? 0, cs)}
        />
        <AdminStatCard
          icon={<XCircle className="w-4 h-4 text-foreground/70" />}
          label={t("reports.cancelled")}
          value={String(summary?.totalCancelled ?? 0)}
        />
      </div>

      {/* ── Area Chart: Daily Sales ── */}
      {dailyChart.length > 1 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-black tracking-tight mb-4 text-foreground">{t("reports.dailyTrend")}</h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChart}>
                <defs>
                  <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-foreground)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--color-foreground)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "1rem",
                    fontSize: 12,
                  }}
                  formatter={(v: ValueType | undefined) => [fmtMoney(Number(v ?? 0), cs), t("reports.totalSales")]}
                />
                <Area
                  type="monotone"
                  dataKey="ventas"
                  stroke="var(--color-foreground)"
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
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-black tracking-tight mb-3 text-foreground">{t("reports.byPaymentMethod")}</h2>
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
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "1rem", fontSize: 12 }}
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
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-black tracking-tight mb-3 text-foreground">{t("reports.byOrderType")}</h2>
          {typePie.length > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typePie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    <Cell fill="var(--color-foreground)" />
                    <Cell fill="oklch(0.55 0 0)" />
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "1rem", fontSize: 12 }}
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
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: i === 0 ? "var(--color-foreground)" : "oklch(0.55 0 0)" }} />
                {p.name}
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-black tracking-tight mb-3 text-foreground">{t("reports.topProducts")}</h2>
          {topProducts.length > 0 ? (
            <div className="space-y-2.5 max-h-[250px] overflow-y-auto custom-scrollbar">
              {topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${i < 3 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
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
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-black tracking-tight mb-4 text-foreground">{t("reports.byCategory")}</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory.map((c) => ({ name: c.categoryName, ventas: Number(c.totalSales || 0) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "1rem", fontSize: 12 }}
                  formatter={(v: ValueType | undefined) => [fmtMoney(Number(v ?? 0), cs), t("reports.totalSales")]}
                />
                <Bar dataKey="ventas" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
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
        className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground rounded-full text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
      >
        <FileDown className="w-4 h-4" />
        Exportar
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-52 bg-card border border-border rounded-2xl shadow-lg z-50 py-1">
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
