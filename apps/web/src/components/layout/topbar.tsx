"use client";

import { Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "@/i18n";
import { MobileNav } from "./mobile-nav";

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <header className="flex items-center justify-between px-6 h-16 bg-background border-b border-border w-full">
      <MobileNav />

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="relative p-2 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label={t("topbar.toggleDarkMode")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
        </button>

        <button className="relative p-2 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border border-background"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 ml-2 border-l border-border h-10">
          <div className="flex flex-col items-end justify-center">
            <span className="text-sm font-semibold text-foreground leading-none mb-1">Sofia L.</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t("topbar.cashier")}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
             <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Sofia&backgroundColor=e6f6f4" alt="Avatar" className="w-full h-full object-cover scale-110" />
          </div>
        </div>
      </div>
    </header>
  );
}

