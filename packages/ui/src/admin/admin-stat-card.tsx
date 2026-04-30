import type { ReactNode } from "react";

interface AdminStatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  /** Subtitle text displayed below the value */
  sub?: string;
  /** Trend text like "+12.04%" or "-3.1%" */
  trend?: string;
  /** Whether the trend is positive */
  trendUp?: boolean;
  /** Optional sparkline or mini-chart slot */
  children?: ReactNode;
  /** GSAP animation attribute (data-a="stat") */
  "data-a"?: string;
}

/**
 * Stat card inspired by Brightly/Rexora dashboards.
 *
 * Card: rounded-2xl bg-card border border-border
 * Icon circle: w-9 h-9 rounded-xl bg-primary/8 border border-primary/10
 * Value: text-3xl font-black tracking-tight
 * Trend: text-[11px] font-bold emerald if up, red if down
 */
export function AdminStatCard({
  icon,
  label,
  value,
  sub,
  trend,
  trendUp = true,
  children,
  "data-a": dataA,
}: AdminStatCardProps) {
  return (
    <div
      data-a={dataA}
      className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-3"
    >
      {/* Top row: label + icon circle */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-muted-foreground leading-tight">
          {label}
        </p>
        <div className="w-9 h-9 rounded-xl bg-primary/8 border border-primary/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>

      {/* Big value */}
      <p className="text-3xl font-black tracking-tight text-foreground leading-none">
        {value}
      </p>

      {/* Sparkline slot */}
      {children && <div className="h-10 -mx-1">{children}</div>}

      {/* Footer: trend + subtitle */}
      {(trend || sub) && (
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          {trend && (
            <span
              className={`font-bold ${
                trendUp
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {trendUp ? "▲" : "▼"} {trend}
            </span>
          )}
          {sub && (
            <span className="text-muted-foreground font-medium">{sub}</span>
          )}
        </div>
      )}
    </div>
  );
}
