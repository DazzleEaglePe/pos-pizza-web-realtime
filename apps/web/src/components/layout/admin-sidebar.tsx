"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  Search,
  Pizza,
  Gift,
  UtensilsCrossed,
  Package,
  AlertTriangle,
  BookOpen,
  ArrowDownUp,
  PackagePlus,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NavigationItem =
  | { section: string }
  | {
      name: string;
      href: string;
      icon: typeof LayoutDashboard;
    };

export function AdminSidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pos_user");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { name?: string; email?: string; role?: string };
      setUser({
        name: parsed?.name || parsed?.email || "Admin",
        role: parsed?.role ?? "",
      });
    } catch {}
  }, []);

  const isAdmin = (user?.role || "").toUpperCase() === "ADMIN";

  const navigation = useMemo<NavigationItem[]>(() => {
    const items: NavigationItem[] = [
      { section: "GESTIÓN" },
      { name: "Dashboard Admin", href: "/admin", icon: LayoutDashboard },
      { section: "CATÁLOGO" },
      { name: "Menú", href: "/admin/menu", icon: UtensilsCrossed },
      { name: "Combos & Promos", href: "/admin/promotions", icon: Gift },
      { section: "STOCK" },
      { name: "Insumos", href: "/admin/inventory", icon: Package },
      { name: "Recetas", href: "/admin/inventory/recipes", icon: BookOpen },
      { name: "Reposición", href: "/admin/inventory/restock", icon: PackagePlus },
      { name: "Movimientos", href: "/admin/inventory/movements", icon: ArrowDownUp },
      { name: "Alertas Stock", href: "/admin/inventory/alerts", icon: AlertTriangle },
    ];

    if (isAdmin) {
      items.push({ section: "CONFIGURACIÓN" });
      items.push({ name: "Negocio", href: "/admin/settings", icon: Settings });
    }

    return items;
  }, [isAdmin]);

  return (
    <div className="flex flex-col w-64 h-screen bg-card border-r border-border p-6 shadow-sm z-10 transition-all duration-300">
      
      {/* User Profile */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center overflow-hidden">
          <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user?.name ?? "Admin")}&backgroundColor=e6f6f4`} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight text-foreground">{user?.name ?? "Admin"}</span>
          <span className="text-xs text-muted-foreground">{(user?.role || "ADMIN").toUpperCase()}</span>
        </div>
      </div>

      <Link
        href="/pos"
        className="group flex items-center gap-2.5 px-3 py-2.5 mb-5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
      >
        <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
        <span className="text-[13px] font-semibold">Volver a Operación</span>
      </Link>

      {/* Global Search */}
      <div className="relative w-full mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-9 pr-3 py-2.5 bg-muted border border-border rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-primary/50 transition-all placeholder:text-muted-foreground text-foreground outline-none"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground bg-card px-1.5 py-0.5 rounded border border-border">⌘K</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navigation.map((item, index) => {
          if ("section" in item) {
             return <div key={`section-${index}`} className="text-[10px] font-bold tracking-widest text-muted-foreground mb-3 mt-6 px-3 uppercase">{item.section}</div>
          }
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin");
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground font-bold shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground font-medium"
              )}
            >
              <div className="flex items-center gap-3">
                {item.icon && <item.icon
                  className={cn(
                    "w-4.5 h-4.5",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground transition-colors"
                  )}
                />}
                <span className="text-[14px]">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer System Brand */}
      <div className="pt-6 mt-auto flex items-center justify-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
        <Pizza className="w-4 h-4 text-primary" />
        <span className="font-bold text-sm tracking-widest text-foreground uppercase text-center w-full">ADMIN PIZZA</span>
      </div>
    </div>
  );
}
