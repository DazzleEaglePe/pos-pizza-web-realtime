"use client";

import { PanelRightClose, PanelRightOpen, Search } from "lucide-react";
import { NotificationBell } from "./notification-bell";
import { usePathname } from "next/navigation";

type AdminRouteMeta = {
  href: string;
  title: string;
  context: string[];
};

const ADMIN_ROUTE_META: AdminRouteMeta[] = [
  { href: "/admin", title: "Dashboard", context: ["Gestión"] },
  { href: "/admin/menu", title: "Menú", context: ["Gestión", "Catálogo"] },
  { href: "/admin/promotions", title: "Combos & Promos", context: ["Gestión", "Catálogo"] },
  { href: "/admin/inventory", title: "Insumos", context: ["Gestión", "Stock"] },
  { href: "/admin/inventory/recipes", title: "Recetas", context: ["Gestión", "Stock", "Insumos"] },
  { href: "/admin/inventory/restock", title: "Reposición", context: ["Gestión", "Stock", "Insumos"] },
  { href: "/admin/inventory/movements", title: "Movimientos", context: ["Gestión", "Stock", "Insumos"] },
  { href: "/admin/inventory/alerts", title: "Alertas Stock", context: ["Gestión", "Stock", "Insumos"] },
  { href: "/admin/settings", title: "Negocio", context: ["Gestión", "Configuración"] },
  { href: "/admin/reports/cancellations", title: "Anulaciones", context: ["Gestión", "Reportes"] },
  { href: "/admin/reports", title: "Ventas", context: ["Gestión", "Reportes"] },
  { href: "/admin/users", title: "Usuarios", context: ["Gestión", "Equipo"] },
  { href: "/admin/tables", title: "Mesas", context: ["Gestión", "Equipo"] },
  { href: "/admin/audit", title: "Registro de Auditoría", context: ["Gestión", "Auditoría"] },
  { href: "/admin/cash-register", title: "Caja", context: ["Gestión", "Reportes"] },
  { href: "/admin/printers", title: "Impresoras", context: ["Gestión", "Configuración"] },
];

export function AdminTopbar({
  rightPanelCollapsed,
  onToggleRightPanel,
}: {
  rightPanelCollapsed: boolean;
  onToggleRightPanel: () => void;
}) {
  const pathname = usePathname();

  const activeRoute =
    ADMIN_ROUTE_META
      .slice()
      .sort((left, right) => right.href.length - left.href.length)
      .find((route) => pathname === route.href || pathname.startsWith(`${route.href}/`)) ??
    ADMIN_ROUTE_META[0];

  const contextLabel = activeRoute.context.join(" / ");
  const title = activeRoute.title;

  return (
    <header className="flex items-center gap-4 px-6 py-3 bg-background w-full shadow-sm">

      {/* Breadcrumbs / Title */}
      <div className="flex flex-col shrink-0">
        <span className="text-muted-foreground text-[11px] font-medium">
          {contextLabel}
        </span>
        <span className="text-foreground text-sm font-semibold tracking-tight">{title}</span>
      </div>

      {/* Search */}
      <button
        onClick={() =>
          window.dispatchEvent(
            new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }),
          )
        }
        className="hidden sm:flex flex-1 max-w-64 items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground transition-colors text-left"
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-[13px]">Buscar en admin...</span>
        <kbd className="text-[10px] bg-background/80 px-1.5 py-0.5 rounded text-muted-foreground/50">
          ⌘K
        </kbd>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1.5 ml-auto">
        <NotificationBell />

        <button
          onClick={onToggleRightPanel}
          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          title={rightPanelCollapsed ? "Expandir panel" : "Contraer panel"}
        >
          {rightPanelCollapsed ? (
            <PanelRightOpen className="w-4 h-4" />
          ) : (
            <PanelRightClose className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
}
