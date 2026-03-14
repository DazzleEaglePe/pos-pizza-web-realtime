"use client";

import { Bell, Globe, Sun, Moon, PanelRightClose, PanelRightOpen } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type AdminRouteMeta = {
  href: string;
  title: string;
  context: string[];
};

const ADMIN_ROUTE_META: AdminRouteMeta[] = [
  { href: "/admin", title: "Dashboard Admin", context: ["Gestión"] },
  { href: "/admin/menu", title: "Menú", context: ["Gestión", "Catálogo"] },
  { href: "/admin/promotions", title: "Combos & Promos", context: ["Gestión", "Catálogo"] },
  { href: "/admin/inventory", title: "Insumos", context: ["Gestión", "Stock"] },
  { href: "/admin/inventory/recipes", title: "Recetas", context: ["Gestión", "Stock", "Insumos"] },
  { href: "/admin/inventory/restock", title: "Reposición", context: ["Gestión", "Stock", "Insumos"] },
  { href: "/admin/inventory/movements", title: "Movimientos", context: ["Gestión", "Stock", "Insumos"] },
  { href: "/admin/inventory/alerts", title: "Alertas Stock", context: ["Gestión", "Stock", "Insumos"] },
  { href: "/admin/settings", title: "Negocio", context: ["Gestión", "Configuración"] },
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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <header className="flex items-center justify-between px-8 py-5 bg-card w-full border-b border-border">

      {/* Breadcrumbs / Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Globe className="w-4 h-4 text-primary" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.18em]">
            {contextLabel}
          </span>
          <span className="text-foreground text-base font-bold tracking-tight">{title}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative p-2 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
          </button>
        )}
        <button className="relative p-2 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-card"></span>
        </button>

        <button
          onClick={onToggleRightPanel}
          className="p-2 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
          title={rightPanelCollapsed ? "Expandir panel" : "Contraer panel"}
        >
          {rightPanelCollapsed ? (
            <PanelRightOpen className="w-5 h-5" />
          ) : (
            <PanelRightClose className="w-5 h-5" />
          )}
        </button>
      </div>
    </header>
  );
}
