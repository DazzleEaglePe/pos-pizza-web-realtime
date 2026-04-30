import type { ReactNode } from "react";

interface Column {
  key: string;
  header: string;
  /** Right-align this column (e.g. money values) */
  align?: "left" | "right" | "center";
  /** Custom className for header th */
  headerClassName?: string;
  /** Custom className for body td */
  cellClassName?: string;
}

interface AdminDataTableProps<T> {
  columns: Column[];
  data: T[];
  /** Render a single table row — return <td> elements only */
  renderRow: (item: T, index: number) => ReactNode;
  /** Key extractor per row */
  rowKey: (item: T, index: number) => string | number;
  /** Icon + message shown when data is empty */
  emptyIcon?: ReactNode;
  emptyMessage?: string;
  /** GSAP animation attribute */
  "data-a"?: string;
}

/**
 * Consistent admin data table wrapper.
 *
 * Card: rounded-2xl bg-card border border-border overflow-hidden
 * Header: bg-muted/40, text-[11px] font-bold uppercase tracking-wider text-muted-foreground
 * Rows:   hover:bg-muted/20 transition-colors, border-b border-border/50
 * Empty:  centered icon + message, py-16
 */
export function AdminDataTable<T>({
  columns,
  data,
  renderRow,
  rowKey,
  emptyIcon,
  emptyMessage = "Sin datos",
  "data-a": dataA,
}: AdminDataTableProps<T>) {
  return (
    <div
      data-a={dataA}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                          ? "text-center"
                          : "text-left"
                    } ${col.headerClassName ?? ""}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr
                  key={rowKey(item, index)}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                >
                  {renderRow(item, index)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          {emptyIcon && <div className="mb-3 opacity-40">{emptyIcon}</div>}
          <p className="text-sm font-medium">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
