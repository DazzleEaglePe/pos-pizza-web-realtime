"use client";

import { useTranslation } from "@/i18n";
import { MobileNav } from "./mobile-nav";
import { NotificationBell } from "./notification-bell";
import { useEffect, useState } from "react";
import { Store, MonitorSmartphone } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCashRegister } from "@/hooks/useCashRegister";

export function Topbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isPosRoute = !pathname.startsWith("/admin");
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const cr = useCashRegister();

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

  return (
    <header className="flex items-center justify-between gap-2 px-3 sm:px-4 h-14 bg-background border-b border-border w-full min-w-0">
      <MobileNav />

      {/* ── Context pills (POS routes only) ── */}
      {isPosRoute && (
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-1.5 h-7 px-2.5 rounded-sm bg-primary/8 border border-primary/15 text-[11px] font-semibold text-primary">
            <Store className="w-3.5 h-3.5" />
            POS Pizza
          </div>
          {cr.register && (
            <div className="flex items-center gap-1.5 h-7 px-2.5 rounded-sm bg-emerald-500/8 border border-emerald-500/15 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <MonitorSmartphone className="w-3.5 h-3.5" />
              {t("topbar.cashier")} #{cr.register.id.slice(-4).toUpperCase()}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 sm:gap-3 ml-auto min-w-0">
        <NotificationBell />

        <div className="flex items-center gap-2 pl-2 sm:pl-3 ml-0.5 sm:ml-1 border-l border-border h-8 min-w-0">
          <div className="hidden sm:flex flex-col items-end justify-center min-w-0">
            <span className="text-[13px] font-semibold text-foreground leading-none">{user?.name ?? "Usuario"}</span>
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{user?.role?.toLowerCase() ?? t("topbar.cashier")}</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
             <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user?.name ?? "Usuario")}&backgroundColor=e6f6f4`} alt="Avatar" className="w-full h-full object-cover scale-110" />
          </div>
        </div>
      </div>
    </header>
  );
}

