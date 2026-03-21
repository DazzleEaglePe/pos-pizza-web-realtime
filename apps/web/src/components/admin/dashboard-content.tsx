"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { Package, AlertTriangle, ChevronRight, TrendingUp, Plus } from "lucide-react";

/* ─── Types ──────────────────────────────────────────── */

interface AlertItem {
  id: string;
  name: string;
  shortage: number;
  unitOfMeasure: string;
  urgency: "critical" | "warning";
}

export interface DashboardData {
  activeCategories: number;
  activeProducts: number;
  totalProducts: number;
  variantCount: number;
  activeModifierGroups: number;
  activeModifiers: number;
  assignedModifierGroups: number;
  activeInventory: number;
  activePromotions: number;
  totalPromotions: number;
  stockAlerts: AlertItem[];
  categoryBreakdown: { name: string; count: number; active: number }[];
}

/* ─── Decorative sparkline data (trend indicators) ───── */

const SPARKLINES = {
  products:   [4, 7, 5, 9, 8, 11, 10, 13, 12, 15].map((v, i) => ({ v, i })),
  promotions: [3, 3, 4, 4,  5,  4,  6,  5,  6,  7].map((v, i) => ({ v, i })),
  inventory:  [20,22,21,23,22, 24, 23, 25, 24, 26].map((v, i) => ({ v, i })),
  alerts:     [8, 7, 9, 6,  8,  5,  7,  4,  6,  3].map((v, i) => ({ v, i })),
};

const CAT_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

/* ─── Component ──────────────────────────────────────── */

export function DashboardContent({ data }: { data: DashboardData }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("[data-a='head']",  { y: -12, opacity: 0, duration: 0.5 });
      tl.from("[data-a='stat']",  { y: 22,  opacity: 0, stagger: 0.08, duration: 0.45 }, "-=0.3");
      tl.from("[data-a='chart']", { y: 18,  opacity: 0, stagger: 0.1,  duration: 0.45 }, "-=0.3");
      tl.from("[data-a='table']", { y: 16,  opacity: 0, duration: 0.4  }, "-=0.25");
    },
    { scope },
  );

  const today = new Date().toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const criticalCount = data.stockAlerts.filter((a) => a.urgency === "critical").length;

  const donutData = [
    { name: "Activos",   value: Math.max(1, data.activeProducts) },
    { name: "Inactivos", value: Math.max(1, data.totalProducts - data.activeProducts) },
  ];

  const STATS = [
    {
      label: "Productos activos",
      value: data.activeProducts,
      sub:   data.activeCategories + " categorías · " + data.variantCount + " variantes",
      trend: "+2 esta semana",
      up:    true,
      clr:   "#3b82f6",
      spark: "products" as keyof typeof SPARKLINES,
    },
    {
      label: "Promociones",
      value: data.activePromotions,
      sub:   "de " + data.totalPromotions + " registradas",
      trend: data.activePromotions > 0 ? "+1 este mes" : "Sin cambios",
      up:    data.activePromotions > 0,
      clr:   "#8b5cf6",
      spark: "promotions" as keyof typeof SPARKLINES,
    },
    {
      label: "Insumos activos",
      value: data.activeInventory,
      sub:   data.stockAlerts.length + " con alerta",
      trend: "En sistema",
      up:    true,
      clr:   "#10b981",
      spark: "inventory" as keyof typeof SPARKLINES,
    },
    {
      label: "Alertas de stock",
      value: data.stockAlerts.length,
      sub:   criticalCount + " críticas",
      trend: criticalCount > 0 ? criticalCount + " urgentes" : "Todo en orden",
      up:    criticalCount === 0,
      clr:   data.stockAlerts.length > 0 ? "#f59e0b" : "#10b981",
      spark: "alerts" as keyof typeof SPARKLINES,
    },
  ];

  return (
    <div ref={scope} className="max-w-350 mx-auto space-y-5 pb-10">

      {/* ── Header ── */}
      <div data-a="head" className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-muted-foreground capitalize tracking-wide">{today}</p>
          <h1 className="text-xl font-bold tracking-tight mt-0.5">Panel de administración</h1>
        </div>
        <Link
          href="/admin/menu"
          className="flex items-center gap-1.5 text-[13px] font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-sm hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar producto
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} data-a="stat" className="bg-card rounded-sm shadow-sm p-4 lg:p-5">
            {/* Label + overflow */}
            <div className="flex items-start justify-between mb-1.5">
              <p className="text-[12px] text-muted-foreground font-medium leading-tight pr-2">{s.label}</p>
              <span className="text-muted-foreground/25 text-sm select-none shrink-0">···</span>
            </div>

            {/* Big value */}
            <p className="text-3xl font-bold tracking-tight">{s.value}</p>

            {/* Sparkline */}
            <div className="h-9 -mx-1 mt-2 mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={SPARKLINES[s.spark]} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
                  <defs>
                    <linearGradient id={"sg-" + s.spark} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={s.clr} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={s.clr} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={s.clr}
                    strokeWidth={1.5}
                    fill={"url(#sg-" + s.spark + ")"}
                    dot={false}
                    activeDot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Trend */}
            <div className="flex items-center gap-1 flex-wrap">
              <TrendingUp
                className={cn("w-3 h-3 shrink-0", s.up ? "text-emerald-500" : "text-amber-500")}
              />
              <span
                className={cn(
                  "text-[11px] font-semibold",
                  s.up
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400",
                )}
              >
                {s.trend}
              </span>
              <span className="text-[11px] text-muted-foreground">· {s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Chart row ── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_276px]">

        {/* Bar chart: products per category */}
        <div data-a="chart" className="bg-card rounded-sm shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold">Catálogo por Categoría</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Productos activos y totales por categoría
              </p>
            </div>
            <Link
              href="/admin/menu"
              className="text-[12px] font-semibold bg-primary/10 text-primary px-3 py-1.5 rounded-sm hover:bg-primary/20 transition-colors"
            >
              Ver menú →
            </Link>
          </div>

          {data.categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart
                data={data.categoryBreakdown.slice(0, 8)}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                barGap={3}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "0.75rem",
                    fontSize: 12,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                  labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  cursor={{ fill: "var(--color-muted)", opacity: 0.5 }}
                />
                <Bar
                  dataKey="active"
                  name="Activos"
                  fill="var(--color-primary)"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={30}
                />
                <Bar
                  dataKey="count"
                  name="Total"
                  fill="var(--color-secondary)"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52.5 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Sin datos de categorías</p>
            </div>
          )}

          <div className="flex items-center gap-5 mt-4 pt-0">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-primary inline-block" />
              <span className="text-[11px] text-muted-foreground font-medium">Activos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-secondary inline-block" />
              <span className="text-[11px] text-muted-foreground font-medium">Total</span>
            </div>
          </div>
        </div>

        {/* Right: donut + top categories */}
        <div data-a="chart" className="bg-card rounded-sm shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Estado del Menú</h2>
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
              Esta semana ↓
            </span>
          </div>

          {/* Donut */}
          <div className="relative flex items-center justify-center py-1">
            <PieChart width={148} height={148}>
              <Pie
                data={donutData}
                cx={69}
                cy={69}
                innerRadius={46}
                outerRadius={68}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                paddingAngle={3}
                stroke="none"
              >
                <Cell fill="var(--color-primary)" />
                <Cell fill="var(--color-muted)" />
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-bold leading-tight">{data.activeProducts}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Activos</p>
              <p className="text-[9px] text-muted-foreground/60">de {data.totalProducts}</p>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="space-y-3 mt-3 flex-1">
            {data.categoryBreakdown.slice(0, 4).map((cat, i) => {
              const pct =
                data.activeProducts > 0
                  ? Math.round((cat.active / data.activeProducts) * 100)
                  : 0;
              return (
                <div key={cat.name} className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
                    style={{ background: CAT_COLORS[i] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-medium truncate">{cat.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: pct + "%", background: CAT_COLORS[i] }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            href="/admin/menu"
            className="mt-4 flex items-center justify-center gap-1 text-[12px] font-medium text-primary hover:underline"
          >
            Ver catálogo completo <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Stock alerts table ── */}
      <div data-a="table" className="bg-card rounded-sm shadow-sm overflow-hidden">

        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold">Alertas de Stock</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {data.stockAlerts.length} insumos bajo mínimo · {criticalCount} críticos
            </p>
          </div>
          <Link
            href="/admin/inventory/restock"
            className="flex items-center gap-1.5 text-[13px] font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Registrar reposición
          </Link>
        </div>

        {data.stockAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3">
              <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-semibold">Stock en orden</p>
            <p className="text-[12px] text-muted-foreground mt-1">
              Todos los insumos sobre el mínimo.
            </p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_150px_90px_110px] px-6 py-2.5 bg-muted/40">
              {["Insumo", "Unidad de medida", "Faltante", "Estado"].map((h) => (
                <span
                  key={h}
                  className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-muted">
              {data.stockAlerts.map((a) => (
                <div
                  key={a.id}
                  className="grid grid-cols-[1fr_150px_90px_110px] px-6 py-3.5 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                        a.urgency === "critical" ? "bg-destructive/10" : "bg-amber-500/10",
                      )}
                    >
                      <AlertTriangle
                        className={cn(
                          "w-3.5 h-3.5",
                          a.urgency === "critical" ? "text-destructive" : "text-amber-500",
                        )}
                      />
                    </div>
                    <span className="text-[13px] font-medium truncate">{a.name}</span>
                  </div>
                  <span className="text-[13px] text-muted-foreground self-center">
                    {a.unitOfMeasure}
                  </span>
                  <span className="text-[13px] font-semibold self-center">
                    {Math.abs(a.shortage)}
                  </span>
                  <div className="self-center">
                    <span
                      className={cn(
                        "text-[11px] font-bold px-3 py-1 rounded-full",
                        a.urgency === "critical"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {a.urgency === "critical" ? "Crítico" : "Bajo"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Table footer */}
            <div className="flex items-center justify-between px-6 py-3 bg-muted/30">
              <span className="text-[12px] text-muted-foreground">
                Mostrando {data.stockAlerts.length} alertas
              </span>
              <Link
                href="/admin/inventory/alerts"
                className="text-[12px] font-medium text-primary hover:underline flex items-center gap-1"
              >
                Ver inventario completo <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
