"use client";

import { Bell, Search, Globe, Moon } from "lucide-react";
import { usePathname } from "next/navigation";

export function AdminTopbar() {
  const pathname = usePathname();
  const title = pathname === "/admin" ? "Overview" : pathname.split("/").pop();

  return (
    <header className="flex items-center justify-between px-8 py-5 bg-[#171717] w-full border-b border-white/5">
      
      {/* Breadcrumbs / Title */}
      <div className="flex items-center gap-3">
         <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="w-4 h-4 text-primary" />
         </div>
         <span className="text-gray-500 text-sm font-semibold">Dashboards /</span>
         <span className="text-white text-sm font-bold capitalize">{title}</span>
      </div>

      {/* Profile & Notifications */}
      <div className="flex items-center gap-4 ml-auto">
        <button className="p-2 text-gray-500 hover:text-white transition-colors">
          <Moon className="w-5 h-5" />
        </button>
        <button className="relative p-2 text-gray-500 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-[#171717]"></span>
        </button>
        <button className="p-2 text-gray-500 hover:text-white transition-colors ml-2">
          <Globe className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
