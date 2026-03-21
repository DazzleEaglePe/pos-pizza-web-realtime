"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  LayoutGrid,
  UtensilsCrossed,
  Gift,
  Package,
  BookOpen,
  PackagePlus,
  ArrowDownUp,
  AlertTriangle,
  ScrollText,
  BarChart3,
  XCircle,
  Wallet,
  Settings,
  Printer,
  Users,
  ReceiptText,
  History,
  HelpCircle,
  Search,
  Monitor,
  type LucideIcon,
} from "lucide-react";

/* ─── Route definitions ───────────────────────────────── */

interface PaletteItem {
  name: string;
  href: string;
  icon: LucideIcon;
  section: string;
  keywords?: string;
}

const ALL_ROUTES: PaletteItem[] = [
  // POS
  { name: "Menú POS", href: "/pos", icon: LayoutGrid, section: "POS", keywords: "menu productos tomar pedido" },
  { name: "Pedidos Activos", href: "/pos/orders", icon: ReceiptText, section: "POS", keywords: "orders pedidos lista" },
  { name: "Mesas", href: "/pos/tables", icon: LayoutGrid, section: "POS", keywords: "tables mesa salon" },
  { name: "Historial de Pedidos", href: "/pos/history", icon: History, section: "POS", keywords: "history historial pasados" },
  { name: "Facturas / Pagos", href: "/pos/bills", icon: ReceiptText, section: "POS", keywords: "bills facturas pagos transacciones" },

  // Kitchen
  { name: "Pantalla de Cocina", href: "/kitchen", icon: Monitor, section: "Cocina", keywords: "kitchen cocina kds" },

  // Admin
  { name: "Dashboard Admin", href: "/admin", icon: LayoutDashboard, section: "Admin", keywords: "dashboard panel inicio" },
  { name: "Usuarios", href: "/admin/users", icon: Users, section: "Admin › Equipo", keywords: "users usuarios equipo roles" },
  { name: "Mesas (Admin)", href: "/admin/tables", icon: LayoutGrid, section: "Admin › Equipo", keywords: "tables mesas zonas admin" },
  { name: "Menú / Catálogo", href: "/admin/menu", icon: UtensilsCrossed, section: "Admin › Catálogo", keywords: "menu catalogo productos categorias" },
  { name: "Combos & Promos", href: "/admin/promotions", icon: Gift, section: "Admin › Catálogo", keywords: "promotions combos promos ofertas" },
  { name: "Insumos", href: "/admin/inventory", icon: Package, section: "Admin › Stock", keywords: "inventory insumos stock items" },
  { name: "Recetas", href: "/admin/inventory/recipes", icon: BookOpen, section: "Admin › Stock", keywords: "recipes recetas ingredientes" },
  { name: "Reposición", href: "/admin/inventory/restock", icon: PackagePlus, section: "Admin › Stock", keywords: "restock reposicion compras entrada" },
  { name: "Movimientos", href: "/admin/inventory/movements", icon: ArrowDownUp, section: "Admin › Stock", keywords: "movements movimientos entradas salidas" },
  { name: "Alertas Stock", href: "/admin/inventory/alerts", icon: AlertTriangle, section: "Admin › Stock", keywords: "alerts alertas stock bajo critico" },
  { name: "Registro Auditoría", href: "/admin/audit", icon: ScrollText, section: "Admin › Auditoría", keywords: "audit auditoria registro logs" },
  { name: "Reporte Ventas", href: "/admin/reports", icon: BarChart3, section: "Admin › Reportes", keywords: "reports ventas reporte graficos" },
  { name: "Anulaciones", href: "/admin/reports/cancellations", icon: XCircle, section: "Admin › Reportes", keywords: "cancellations anulaciones cancelados" },
  { name: "Historial de Caja", href: "/admin/cash-register", icon: Wallet, section: "Admin › Reportes", keywords: "cash register caja historial cuadre" },
  { name: "Configuración Negocio", href: "/admin/settings", icon: Settings, section: "Admin › Config", keywords: "settings configuracion negocio empresa" },
  { name: "Impresoras", href: "/admin/printers", icon: Printer, section: "Admin › Config", keywords: "printers impresoras ticket receipt" },
  { name: "Centro de Ayuda", href: "/help", icon: HelpCircle, section: "Soporte", keywords: "help ayuda soporte faq" },
];

/* ─── Component ───────────────────────────────────────── */

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Toggle open/close
  const toggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) {
        setQuery("");
        setSelectedIndex(0);
      }
      return !prev;
    });
  }, []);

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, toggle]);

  // Focus input when open
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Filter items
  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_ROUTES;
    const terms = query.toLowerCase().split(/\s+/);
    return ALL_ROUTES.filter((item) => {
      const text = `${item.name} ${item.section} ${item.keywords || ""}`.toLowerCase();
      return terms.every((t) => text.includes(t));
    });
  }, [query]);

  // Reset selection when query changes
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setSelectedIndex(0);
  }, []);

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      if (pathname !== href) router.push(href);
    },
    [pathname, router],
  );

  // Handle keyboard navigation inside list
  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      navigate(filtered[selectedIndex].href);
    }
  };

  // Group by section
  const grouped = useMemo(() => {
    const groups: { section: string; items: (PaletteItem & { flatIndex: number })[] }[] = [];
    let flatIndex = 0;
    for (const item of filtered) {
      const last = groups[groups.length - 1];
      const entry = { ...item, flatIndex };
      if (last && last.section === item.section) {
        last.items.push(entry);
      } else {
        groups.push({ section: item.section, items: [entry] });
      }
      flatIndex++;
    }
    return groups;
  }, [filtered]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-[20%] -translate-x-1/2 z-50 w-[min(560px,calc(100vw-2rem))] animate-in fade-in-0 slide-in-from-top-4 duration-200">
        <div className="bg-card border border-border rounded-sm shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Buscar página o sección..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground bg-muted border border-border rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[360px] overflow-y-auto custom-scrollbar py-2">
            {grouped.length > 0 ? (
              grouped.map((group) => (
                <div key={group.section}>
                  <div className="px-4 py-1.5">
                    <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                      {group.section}
                    </span>
                  </div>
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    const isSelected = selectedIndex === item.flatIndex;
                    return (
                      <button
                        key={item.href}
                        data-index={item.flatIndex}
                        onClick={() => navigate(item.href)}
                        onMouseEnter={() => setSelectedIndex(item.flatIndex)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-accent",
                          isActive && "font-semibold",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "w-4 h-4 shrink-0",
                            isSelected ? "text-primary" : "text-muted-foreground",
                          )}
                        />
                        <span className="flex-1 text-left truncate">{item.name}</span>
                        {isActive && (
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            actual
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="py-10 text-center">
                <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No se encontraron resultados
                </p>
              </div>
            )}
          </div>

          {/* Footer hints */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border bg-muted/30">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <kbd className="px-1 py-0.5 bg-muted border border-border rounded text-[10px] font-bold">↑↓</kbd>
              navegar
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <kbd className="px-1 py-0.5 bg-muted border border-border rounded text-[10px] font-bold">↵</kbd>
              ir
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <kbd className="px-1 py-0.5 bg-muted border border-border rounded text-[10px] font-bold">esc</kbd>
              cerrar
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
