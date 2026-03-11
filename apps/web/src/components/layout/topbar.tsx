"use client";

import { Search, Bell, Menu, Sun, Moon, Languages } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslation, locales, localeNames, type Locale } from "@/i18n";
import { MobileNav } from "./mobile-nav";

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const { t, locale, setLocale } = useTranslation();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting until component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLocale = () => {
    const nextLocale = locale === "es" ? "en" : "es";
    setLocale(nextLocale);
  };

  return (
    <header className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-background border-b border-border w-full gap-4">
      <div className="flex items-center w-full sm:w-auto gap-4">
        {/* Mobile Navigation Toggle */}
        <MobileNav />

        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("topbar.searchPlaceholder")}
            className="w-full pl-9 pr-4 py-2 h-10 bg-background border-input rounded-md text-sm focus-visible:ring-1 focus-visible:ring-ring transition-all placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Profile & Notifications */}
      <div className="flex items-center gap-2 sm:ml-auto">
        {mounted && (
          <>
            {/* Language Toggle */}
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1.5 px-3 py-2 h-10 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors uppercase tracking-wider focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Toggle Language"
            >
              <Languages className="h-4 w-4" />
              {locale}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative p-2 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={t("topbar.toggleDarkMode")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
            </button>
          </>
        )}

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

