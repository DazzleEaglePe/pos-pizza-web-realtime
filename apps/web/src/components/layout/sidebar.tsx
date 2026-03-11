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
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { posAlert } from "@/lib/sweetalert";
import { useTranslation } from "@/i18n";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Sidebar({ className, onNavigate }: { className?: string, onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    { name: t("sidebar.menu"), href: "/pos", icon: LayoutGrid },
    { name: t("sidebar.orderList"), href: "/pos/orders", icon: ReceiptText, badge: "9+" },
    { name: t("sidebar.history"), href: "/pos/history", icon: History },
    { name: t("sidebar.bills"), href: "/pos/bills", icon: ReceiptText },
    { name: t("sidebar.settings"), href: "/admin/settings", icon: Settings },
    { name: t("sidebar.helpCenter"), href: "/help", icon: HelpCircle },
  ];

  const handleLogout = async () => {
    const result = await posAlert.fire({
      title: t("sidebar.signOutConfirmTitle"),
      text: t("sidebar.signOutConfirmText"),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t("sidebar.signOutConfirmButton"),
      cancelButtonText: t("sidebar.cancel"),
      confirmButtonColor: '#ff5757',
    });

    if (result.isConfirmed) {
      localStorage.removeItem("pos_access_token");
      localStorage.removeItem("pos_user");
      // Remove cookie for SSR
      document.cookie = "pos_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      router.replace("/login");
    }
  };

  return (
    <div className={cn(
      "hidden lg:flex flex-col h-screen bg-background border-r border-border shadow-sm z-10 transition-all duration-300 shrink-0 relative",
      isCollapsed ? "w-[88px]" : "w-[260px]",
      className
    )}>
      {/* Brand */}
      <div className={cn("flex items-center gap-3 mb-8 cursor-default pt-6", isCollapsed ? "px-0 justify-center" : "px-6")}>
        <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 flex items-center justify-center shrink-0">
           <Pizza className="w-5 h-5 text-primary" />
        </div>
        {!isCollapsed && (
          <span className="font-bold text-xl tracking-tight text-foreground whitespace-nowrap overflow-hidden">
            POS Pizza
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 mt-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                "group flex items-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-hidden",
                isCollapsed ? "justify-center mx-4 rounded-xl py-3" : "justify-between pl-6 pr-4 py-3.5 mx-0 rounded-r-xl border-l-[4px]",
                isActive
                  ? isCollapsed 
                    ? "bg-primary/10 text-primary" 
                    : "bg-gradient-to-r from-primary/10 to-transparent border-primary text-primary font-bold shadow-sm"
                  : isCollapsed 
                    ? "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                    : "border-transparent text-muted-foreground hover:bg-accent/30 hover:text-accent-foreground font-semibold"
              )}
            >
              <div className="flex items-center gap-4">
                <item.icon
                  className={cn(
                    "w-[22px] h-[22px]",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {!isCollapsed && (
                  <span className="text-[15px] tracking-wide whitespace-nowrap">{item.name}</span>
                )}
              </div>
              
              {!isCollapsed && item.badge && (
                <span className="bg-[#fc5555] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Sign Out & Collapse */}
      <div className="mt-auto flex flex-col gap-2 p-4">
        <button 
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 border border-transparent outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2",
            isCollapsed ? "justify-center p-3" : "py-3 pl-2 pr-4 justify-start w-full"
          )}
          title={isCollapsed ? t("sidebar.signOut") : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" strokeWidth={2} />
          {!isCollapsed && <span className="text-[15px] font-semibold">{t("sidebar.signOut")}</span>}
        </button>
        
        {/* Desktop Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "hidden lg:flex items-center justify-center p-3 rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 border border-transparent mt-2 mb-2 bg-muted/40",
            !isCollapsed && "mx-0"
          )}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

