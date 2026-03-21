"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  LayoutGrid,
  Settings,
  Gift,
  ArrowRight,
  UtensilsCrossed,
  Package,
  AlertTriangle,
  BookOpen,
  ArrowDownUp,
  PackagePlus,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  XCircle,
  Users,
  Sun,
  Moon,
  Monitor,
  LogOut,
  MoreHorizontal,
  Printer,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

/* ─── Types ───────────────────────────────────────────── */

interface NavLink {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
}

interface NavSection {
  id: string;
  label: string;
  items: NavLink[];
}

/* ─── Storage ─────────────────────────────────────────── */

const STORAGE_KEY = "admin_sidebar_open";
const ADMIN_COLLAPSED_KEY = "admin_sidebar_collapsed";

function loadOpen(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveOpen(state: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/* ─── Component ───────────────────────────────────────── */

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(ADMIN_COLLAPSED_KEY) === "1";
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(ADMIN_COLLAPSED_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === ADMIN_COLLAPSED_KEY) setIsCollapsed(e.newValue === "1");
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pos_user");
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        name?: string;
        email?: string;
        role?: string;
      };
      setUser({
        name: parsed?.name || parsed?.email || "Admin",
        role: parsed?.role ?? "",
      });
    } catch {}
  }, []);

  /* GSAP entrance */
  useGSAP(
    () => {
      if (isCollapsed) return;
      gsap.from("[data-nav-item]", {
        x: -8,
        opacity: 0,
        stagger: 0.02,
        duration: 0.3,
        ease: "power2.out",
      });
    },
    { scope: containerRef, dependencies: [] },
  );

  const isAdmin = (user?.role || "").toUpperCase() === "ADMIN";

  const sections = useMemo<NavSection[]>(() => {
    const s: NavSection[] = [
      {
        id: "gestion",
        label: "GESTIÓN",
        items: [
          { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        ],
      },
      {
        id: "equipo",
        label: "EQUIPO",
        items: [
          { name: "Usuarios", href: "/admin/users", icon: Users },
          { name: "Mesas", href: "/admin/tables", icon: LayoutGrid },
        ],
      },
      {
        id: "catalogo",
        label: "CATÁLOGO",
        items: [
          { name: "Menú", href: "/admin/menu", icon: UtensilsCrossed },
          { name: "Combos & Promos", href: "/admin/promotions", icon: Gift },
        ],
      },
      {
        id: "stock",
        label: "STOCK",
        items: [
          { name: "Insumos", href: "/admin/inventory", icon: Package },
          { name: "Recetas", href: "/admin/inventory/recipes", icon: BookOpen },
          {
            name: "Reposición",
            href: "/admin/inventory/restock",
            icon: PackagePlus,
          },
          {
            name: "Movimientos",
            href: "/admin/inventory/movements",
            icon: ArrowDownUp,
          },
          {
            name: "Alertas",
            href: "/admin/inventory/alerts",
            icon: AlertTriangle,
          },
        ],
      },
    ];

    if (isAdmin) {
      s.push({
        id: "auditoria",
        label: "AUDITORÍA",
        items: [
          { name: "Registro", href: "/admin/audit", icon: ScrollText },
        ],
      });
      s.push({
        id: "reportes",
        label: "REPORTES",
        items: [
          { name: "Ventas", href: "/admin/reports", icon: BarChart3 },
          {
            name: "Anulaciones",
            href: "/admin/reports/cancellations",
            icon: XCircle,
          },
          { name: "Caja", href: "/admin/cash-register", icon: Wallet },
        ],
      });
      s.push({
        id: "config",
        label: "CONFIGURACIÓN",
        items: [
          { name: "Negocio", href: "/admin/settings", icon: Settings },
          { name: "Impresoras", href: "/admin/printers", icon: Printer },
        ],
      });
    }

    return s;
  }, [isAdmin]);

  const activeSectionId = useMemo(() => {
    for (const sec of sections) {
      if (
        sec.items.some(
          (it) =>
            pathname === it.href ||
            (it.href !== "/admin" && pathname.startsWith(it.href + "/")),
        )
      ) {
        return sec.id;
      }
    }
    return "gestion";
  }, [sections, pathname]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => {
      const saved = loadOpen();
      return { ...saved, [activeSectionId]: true };
    },
  );

  useEffect(() => {
    setOpenSections((prev) => {
      if (prev[activeSectionId]) return prev;
      const next = { ...prev, [activeSectionId]: true };
      saveOpen(next);
      return next;
    });
  }, [activeSectionId]);

  const toggleSection = useCallback((id: string) => {
    setOpenSections((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveOpen(next);
      return next;
    });
  }, []);

  const isLinkActive = useCallback(
    (item: NavLink) => {
      if (pathname === item.href) return true;
      if (item.href === "/admin") return false;
      if (!pathname.startsWith(item.href + "/")) return false;
      const allLinks = sections.flatMap((s) => s.items);
      const hasChildMatch = allLinks.some(
        (n) =>
          n.href !== item.href &&
          (pathname === n.href || pathname.startsWith(n.href + "/")),
      );
      return !hasChildMatch;
    },
    [pathname, sections],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col h-screen bg-background transition-all duration-300 ease-out shadow-[1px_0_0_0_oklch(0.95_0_0)] dark:shadow-[1px_0_0_0_oklch(0.22_0_0)]",
        isCollapsed ? "w-16" : "w-56",
      )}
    >
      {/* Header — Brand */}
      <div
        className={cn(
          "flex items-center shrink-0",
          isCollapsed ? "p-3 justify-center" : "px-4 py-4 gap-2.5",
        )}
      >
        {isCollapsed ? (
          <button
            onClick={toggleCollapsed}
            className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold"
            title="Expandir"
          >
            P
          </button>
        ) : (
          <>
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
              P
            </div>
            <span className="flex-1 text-[15px] font-bold text-foreground tracking-tight truncate">
              POS Pizza
            </span>
            <button
              onClick={toggleCollapsed}
              className="w-7 h-7 shrink-0 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Colapsar"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Back to POS */}
      <div className={cn("shrink-0", isCollapsed ? "p-2" : "px-3 pb-2")}>
        <Link
          href="/pos"
          title={isCollapsed ? "Punto de venta" : undefined}
          className={cn(
            "flex items-center gap-2 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors",
            isCollapsed ? "justify-center" : "px-3",
          )}
        >
          <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span className="text-[13px] font-medium">Punto de venta</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
        {sections.map((section) => {
          const isOpen = !!openSections[section.id];
          const hasActiveChild = section.id === activeSectionId;
          const collapsible = section.items.length > 1;

          return (
            <div key={section.id}>
              {/* Section header */}
              {collapsible && !isCollapsed ? (
                <button
                  onClick={() => toggleSection(section.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 mt-3 first:mt-0 rounded-md transition-colors",
                    hasActiveChild
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="text-[10px] font-semibold tracking-widest uppercase">
                    {section.label}
                  </span>
                  <ChevronRight
                    className={cn(
                      "w-3 h-3 transition-transform duration-200",
                      isOpen && "rotate-90",
                    )}
                  />
                </button>
              ) : !isCollapsed ? (
                <div className="text-[10px] font-semibold tracking-widest text-muted-foreground px-2.5 py-1.5 mt-3 first:mt-0 uppercase">
                  {section.label}
                </div>
              ) : (
                <div className="my-2" />
              )}

              {/* Items */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  isCollapsed
                    ? "max-h-125 opacity-100"
                    : !collapsible
                      ? "max-h-125 opacity-100"
                      : isOpen
                        ? "max-h-125 opacity-100"
                        : "max-h-0 opacity-0",
                )}
              >
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isLinkActive(item);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={isCollapsed ? item.name : undefined}
                        data-nav-item
                        className={cn(
                          "group flex items-center gap-2.5 py-2 rounded-sm transition-all duration-150",
                          isCollapsed ? "justify-center px-0" : "px-2.5",
                          active
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground font-medium",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "w-4 h-4 shrink-0",
                            active
                              ? "text-primary-foreground"
                              : "text-muted-foreground group-hover:text-foreground transition-colors",
                          )}
                        />
                        {!isCollapsed && (
                          <span className="text-[13px]">{item.name}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Promo card */}
      {!isCollapsed && (
        <div className="px-3 pb-2 shrink-0">
          <div className="rounded-sm bg-linear-to-br from-primary to-primary/60 p-4 text-primary-foreground relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.2), transparent 55%)' }}
            />
            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/60 mb-1">
                Operaciones
              </p>
              <p className="text-[13px] font-bold mb-3 leading-snug">Volver al punto de venta</p>
              <Link
                href="/pos"
                className="flex items-center gap-1.5 text-[12px] font-semibold bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-xl w-fit"
              >
                Ir ahora <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        className={cn(
          "shrink-0 bg-muted/30",
          isCollapsed ? "p-2" : "p-3",
        )}
      >
        <AdminUserMenu
          user={user}
          mounted={mounted}
          theme={theme}
          setTheme={setTheme}
          router={router}
          isCollapsed={isCollapsed}
        />
      </div>
    </div>
  );
}

/* ─── User Menu ───────────────────────────────────────── */

function AdminUserMenu({
  user,
  mounted,
  theme,
  setTheme,
  router,
  isCollapsed,
}: {
  user: { name: string; role: string } | null;
  mounted: boolean;
  theme: string | undefined;
  setTheme: (t: string) => void;
  router: ReturnType<typeof useRouter>;
  isCollapsed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!user) return null;

  const themeOptions = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ];

  const handleLogout = () => {
    const rt = localStorage.getItem("pos_refresh_token");
    if (rt) {
      fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/auth/logout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rt }),
        },
      ).catch(() => {});
    }
    localStorage.removeItem("pos_access_token");
    localStorage.removeItem("pos_refresh_token");
    localStorage.removeItem("pos_user");
    document.cookie =
      "pos_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.replace("/login");
  };

  return (
    <div
      className={cn(
        "relative flex items-center gap-2 py-1",
        isCollapsed ? "justify-center px-0" : "px-1",
      )}
      ref={ref}
    >
      <div className="relative shrink-0">
        <button
          onClick={() => isCollapsed && setOpen(!open)}
          className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold"
        >
          {user.name.charAt(0).toUpperCase()}
        </button>
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
      </div>

      {!isCollapsed && (
        <span className="flex-1 text-[13px] font-medium text-foreground truncate">
          {user.name}
        </span>
      )}

      {!isCollapsed && (
        <button
          onClick={() => setOpen(!open)}
          className="w-7 h-7 shrink-0 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      )}

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-[calc(100%+8px)] -ml-1 bg-card rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 bg-muted/40">
            <p className="text-sm font-semibold text-foreground truncate">
              {user.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {user.role.toLowerCase()}
            </p>
          </div>

          {mounted && (
            <div className="px-4 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-foreground font-medium">
                  Tema
                </span>
                <div className="flex items-center bg-muted rounded-md p-0.5 gap-0.5">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-md transition-all",
                        theme === opt.value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      title={opt.label}
                    >
                      <opt.icon className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
}
