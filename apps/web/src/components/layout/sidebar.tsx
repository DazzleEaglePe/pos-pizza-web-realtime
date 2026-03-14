"use client";

import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  History,
  ReceiptText,
  Settings,
  HelpCircle,
  LogOut,
  Pizza,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { posAlert } from "@/lib/sweetalert";
import { useTranslation } from "@/i18n";
import { useEffect, useState } from "react";

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
        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

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
    { name: t("sidebar.history"), href: "/pos/history", icon: History },
    { name: t("sidebar.bills"), href: "/pos/bills", icon: ReceiptText },
  ];

  const utilNav: NavItem[] = [
    { name: t("sidebar.settings"), href: "/admin/settings", icon: Settings },
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
      localStorage.removeItem("pos_access_token");
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
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
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
            onClick={() => setIsCollapsed(true)}
            className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
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
            isActive={pathname === item.href}
            isCollapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        ))}

        <div className={cn("my-3 border-t border-sidebar-border", isCollapsed ? "mx-1" : "mx-1")} />

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
        {/* User card */}
        {!isCollapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-muted/40">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/15 overflow-hidden shrink-0">
              <img
                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=e6f6f4`}
                alt={user.name}
                className="w-full h-full object-cover scale-110"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate leading-none mb-0.5">
                {user.name}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                {user.role.toLowerCase()}
              </p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={isCollapsed ? t("sidebar.signOut") : undefined}
          className={cn(
            "flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors outline-none focus-visible:ring-2 focus-visible:ring-destructive",
            isCollapsed && "justify-center px-0",
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" strokeWidth={2} />
          {!isCollapsed && <span>{t("sidebar.signOut")}</span>}
        </button>

        {/* Expand when collapsed */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex items-center justify-center w-full mt-1.5 py-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

