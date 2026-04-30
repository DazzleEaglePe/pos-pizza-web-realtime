"use client";

import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  History,
  ReceiptText,
  Shield,
  HelpCircle,
  LogOut,
  Pizza,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  MoreHorizontal,
  Bell,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { posAlert } from "@/lib/sweetalert";
import { useTranslation } from "@/i18n";
import { useCallback, useEffect, useRef, useState } from "react";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

function NavLink({
  item,
  isActive,
  isCollapsed,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={isCollapsed ? item.name : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isCollapsed && "justify-center px-0",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <item.icon
        className={cn(
          "shrink-0 w-5 h-5",
          isActive ? "text-primary" : "text-muted-foreground",
        )}
        strokeWidth={isActive ? 2.5 : 2}
      />
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{item.name}</span>
          {item.badge && (
            <span className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive leading-none">
              {item.badge}
            </span>
          )}
        </>
      )}
      {isCollapsed && item.badge && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive border border-background" />
      )}
    </Link>
  );
}

export function Sidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("pos_sidebar_collapsed") === "1";
  });
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Persist + sync collapsed state across tabs
  const toggleCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
    try { localStorage.setItem("pos_sidebar_collapsed", collapsed ? "1" : "0"); } catch {}
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "pos_sidebar_collapsed") setIsCollapsed(e.newValue === "1");
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pos_user");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { name?: string; email?: string; role?: string };
      setUser({
        name: parsed?.name || parsed?.email || "Usuario",
        role: parsed?.role ?? "",
      });
    } catch {}
  }, []);

  const mainNav: NavItem[] = [
    { name: t("sidebar.menu"), href: "/pos", icon: LayoutGrid },
    { name: t("sidebar.orderList"), href: "/pos/orders", icon: ReceiptText, badge: "9+" },
    { name: "Mesas", href: "/pos/tables", icon: LayoutGrid },
    { name: t("sidebar.history"), href: "/pos/history", icon: History },
    { name: t("sidebar.bills"), href: "/pos/bills", icon: ReceiptText },
  ];

  const isAdmin = (user?.role || "").toUpperCase() === "ADMIN";

  const managementNav: NavItem[] = isAdmin
    ? [{ name: t("sidebar.management"), href: "/admin", icon: Shield }]
    : [];

  const utilNav: NavItem[] = [
    { name: t("sidebar.helpCenter"), href: "/help", icon: HelpCircle },
  ];

  const handleLogout = async () => {
    const result = await posAlert.fire({
      title: t("sidebar.signOutConfirmTitle"),
      text: t("sidebar.signOutConfirmText"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("sidebar.signOutConfirmButton"),
      cancelButtonText: t("sidebar.cancel"),
    });
    if (result.isConfirmed) {
      // Server-side logout: revoke refresh token
      const rt = localStorage.getItem("pos_refresh_token");
      if (rt) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rt }),
        }).catch(() => {});
      }
      localStorage.removeItem("pos_access_token");
      localStorage.removeItem("pos_refresh_token");
      localStorage.removeItem("pos_user");
      document.cookie =
        "pos_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      router.replace("/login");
    }
  };

  return (
    <div
      className={cn(
        "hidden lg:flex flex-col h-screen bg-sidebar border-r border-sidebar-border z-10 transition-[width] duration-300 shrink-0",
        isCollapsed ? "w-18" : "w-60",
        className,
      )}
    >
      {/* ── Brand header ── */}
      <div
        className={cn(
          "flex items-center h-16 border-b border-sidebar-border px-4 gap-2.5",
          isCollapsed ? "justify-center" : "justify-between",
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Pizza className="w-4 h-4 text-primary" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-[15px] tracking-tight text-sidebar-foreground truncate">
              POS Pizza
            </span>
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={() => toggleCollapsed(true)}
            className="w-7 h-7 shrink-0 flex items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto py-4",
          isCollapsed ? "px-2 space-y-1" : "px-3 space-y-0.5",
        )}
      >
        {mainNav.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href || (item.href === "/pos" && pathname === "/")}
            isCollapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        ))}

        {managementNav.length > 0 && (
          <>
            <div
              className={cn(
                "my-3 border-t border-sidebar-border",
                isCollapsed ? "mx-1" : "mx-1",
              )}
            />

            {!isCollapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                {t("sidebar.managementSection")}
              </p>
            )}

            {managementNav.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={pathname.startsWith(item.href)}
                isCollapsed={isCollapsed}
                onNavigate={onNavigate}
              />
            ))}
          </>
        )}

        <div className={cn("my-3 border-t border-sidebar-border", isCollapsed ? "mx-1" : "mx-1")} />

        {!isCollapsed && (
          <p className="px-3 mb-1.5 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            {t("sidebar.supportSection")}
          </p>
        )}

        {utilNav.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href}
            isCollapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* ── Footer ── */}
      <div
        className={cn(
          "border-t border-sidebar-border py-3",
          isCollapsed ? "px-2" : "px-3",
        )}
      >
        <UserMenu
          user={user}
          isCollapsed={isCollapsed}
          mounted={mounted}
          theme={theme}
          setTheme={setTheme}
          onLogout={handleLogout}
        />

        {/* Expand when collapsed */}
        {isCollapsed && (
          <button
            onClick={() => toggleCollapsed(false)}
            className="flex items-center justify-center w-full mt-1.5 py-2 rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── User Menu Popover ──────────────────────────────── */

function UserMenu({
  user,
  isCollapsed,
  mounted,
  theme,
  setTheme,
  onLogout,
}: {
  user: { name: string; role: string } | null;
  isCollapsed: boolean;
  mounted: boolean;
  theme: string | undefined;
  setTheme: (t: string) => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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

  /* Collapsed: just avatar */
  if (isCollapsed) {
    return (
      <div className="relative flex flex-col items-center gap-1.5 mb-2" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="w-8 h-8 rounded-full bg-primary/10 border border-primary/15 overflow-hidden shrink-0 hover:ring-2 hover:ring-primary/30 transition-all"
        >
          <img
            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=e6f6f4`}
            alt={user.name}
            className="w-full h-full object-cover scale-110"
          />
        </button>

        {open && (
          <div className="absolute bottom-full left-0 mb-2 w-56 bg-card border border-border rounded-sm shadow-xl z-50 overflow-hidden">
            <PopoverContent user={user} themeOptions={themeOptions} theme={theme} setTheme={setTheme} mounted={mounted} onLogout={onLogout} onClose={() => setOpen(false)} />
          </div>
        )}
      </div>
    );
  }

  /* Expanded: user row with ··· and 🔔 */
  return (
    <div className="relative flex items-center gap-2 px-1 py-1" ref={ref}>
      {/* Status dot + avatar */}
      <div className="relative shrink-0">
        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/15 overflow-hidden">
          <img
            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=e6f6f4`}
            alt={user.name}
            className="w-full h-full object-cover scale-110"
          />
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-sidebar" />
      </div>

      {/* Name */}
      <span className="flex-1 text-[13px] font-semibold text-foreground truncate">
        {user.name}
      </span>

      {/* ··· menu trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="w-7 h-7 shrink-0 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-[calc(100%+8px)] -ml-1 bg-card border border-border rounded-sm shadow-xl z-50 overflow-hidden">
          <PopoverContent user={user} themeOptions={themeOptions} theme={theme} setTheme={setTheme} mounted={mounted} onLogout={onLogout} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

/* ─── Popover Content ────────────────────────────────── */

function PopoverContent({
  user,
  themeOptions,
  theme,
  setTheme,
  mounted,
  onLogout,
  onClose,
}: {
  user: { name: string; role: string };
  themeOptions: { value: string; icon: typeof Sun; label: string }[];
  theme: string | undefined;
  setTheme: (t: string) => void;
  mounted: boolean;
  onLogout: () => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* User info header */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.role.toLowerCase()}</p>
      </div>

      {/* Theme row */}
      {mounted && (
        <div className="px-4 py-2.5 border-b border-border">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-foreground font-medium">Tema</span>
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

      {/* Logout */}
      <button
        onClick={() => { onClose(); onLogout(); }}
        className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Cerrar Sesión
      </button>
    </>
  );
}

