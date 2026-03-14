"use client";

import { Bell, Globe, Sun, Moon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function AdminTopbar() {
  const pathname = usePathname();

  const segmentLabel: Record<string, string> = {
    admin: "Dashboard Admin",
    menu: "Menú",
    promotions: "Combos & Promos",
    inventory: "Insumos",
    recipes: "Recetas",
    restock: "Reposición",
    movements: "Movimientos",
    alerts: "Alertas Stock",
    settings: "Negocio",
  };

  const segments = pathname.split("/").filter(Boolean);
  const adminIndex = segments.indexOf("admin");
  const adminSegments = adminIndex >= 0 ? segments.slice(adminIndex) : ["admin"];

  const breadcrumb = adminSegments.map((segment, index) => {
    if (index === 0) return "Gestión";
    return segmentLabel[segment] ?? segment;
  });

  const title = breadcrumb[breadcrumb.length - 1] ?? "Gestión";
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
        <span className="text-muted-foreground text-sm font-semibold">
          {breadcrumb.join(" / ")}
        </span>
        <span className="text-foreground text-sm font-bold">{title}</span>
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
      </div>
    </header>
  );
}
