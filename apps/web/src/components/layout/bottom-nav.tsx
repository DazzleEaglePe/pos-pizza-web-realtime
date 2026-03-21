"use client";

import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  UtensilsCrossed,
  ReceiptText,
  MoreHorizontal,
  History,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";
import { useRef, useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { posAlert } from "@/lib/sweetalert";

type TabItem = {
  name: string;
  href: string;
  icon: typeof LayoutGrid;
};

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const [user] = useState<{ name: string; role: string } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("pos_user");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { name?: string; email?: string; role?: string };
      return {
        name: parsed?.name || parsed?.email || "Usuario",
        role: parsed?.role ?? "",
      };
    } catch {
      return null;
    }
  });

  const [mounted] = useState(() => typeof window !== "undefined");

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpen]);

  const isAdmin = (user?.role || "").toUpperCase() === "ADMIN";

  const tabs: TabItem[] = [
    { name: t("sidebar.menu"), href: "/pos", icon: LayoutGrid },
    { name: t("tables.selectTable").split(" ")[0], href: "/pos/orders", icon: UtensilsCrossed },
    { name: t("sidebar.orderList"), href: "/pos/orders", icon: ReceiptText },
  ];

  const handleLogout = async () => {
    setMoreOpen(false);
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

  const themeOptions = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/30 safe-area-bottom">
      <div className="flex items-stretch justify-around h-14 px-2">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/pos"
              ? pathname === "/pos" || pathname === "/"
              : pathname === tab.href;

          return (
            <Link
              key={tab.href + tab.name}
              href={tab.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              <tab.icon
                className={cn("w-5 h-5", isActive && "text-primary")}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span>{tab.name}</span>
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}

        {/* More button */}
        <div className="flex-1 relative" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              "w-full h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              moreOpen ? "text-primary" : "text-muted-foreground",
            )}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>Más</span>
          </button>

          {/* More dropdown */}
          {moreOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-56 bg-card border border-border rounded-sm shadow-xl overflow-hidden z-50">
              <div className="py-1">
                <Link
                  href="/pos/history"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <History className="w-4 h-4 text-muted-foreground" />
                  {t("sidebar.history")}
                </Link>
                <Link
                  href="/pos/bills"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <ReceiptText className="w-4 h-4 text-muted-foreground" />
                  {t("sidebar.bills")}
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    {t("sidebar.management")}
                  </Link>
                )}

                <Link
                  href="/help"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  {t("sidebar.helpCenter")}
                </Link>

                <div className="border-t border-border/20 my-1" />

                {/* Theme switcher */}
                {mounted && (
                  <div className="flex items-center gap-1 px-4 py-2">
                    {themeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setTheme(opt.value)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                          theme === opt.value
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent",
                        )}
                      >
                        <opt.icon className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="border-t border-border/20 my-1" />

                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  {t("sidebar.signOut")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
