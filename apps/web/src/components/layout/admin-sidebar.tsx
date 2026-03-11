"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Settings,
  MessageSquare,
  Star,
  LogOut,
  Moon,
  Bell,
  Search,
  Pizza
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { section: "DASHBOARDS" },
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "eCommerce", href: "/admin/ecommerce", icon: ShoppingCart },
  { name: "Analytics", href: "/admin/analytics", icon: LayoutDashboard },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { section: "SETTINGS" },
  { name: "Messages", href: "/admin/messages", icon: MessageSquare },
  { name: "Customer Reviews", href: "/admin/reviews", icon: Star },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 h-screen bg-[#1c1c1c] border-r border-white/5 p-6 shadow-sm z-10 transition-all duration-300">
      
      {/* User Profile */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center overflow-hidden">
           <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Guy&backgroundColor=e6f6f4" alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
           <span className="font-bold text-sm tracking-tight text-white">Guy Hawkins</span>
           <span className="text-xs text-gray-500">Admin</span>
        </div>
      </div>

      {/* Global Search */}
      <div className="relative w-full mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-9 pr-3 py-2.5 bg-[#252525] border border-white/5 rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-primary/50 transition-all placeholder:text-gray-500 text-white outline-none"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-500 bg-[#1c1c1c] px-1.5 py-0.5 rounded border border-white/5">⌘K</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navigation.map((item, index) => {
          if (item.section) {
             return <div key={`section-${index}`} className="text-[10px] font-bold tracking-widest text-gray-500 mb-3 mt-6 px-3 uppercase">{item.section}</div>
          }
          const isActive = pathname === item.href || (pathname.startsWith(item.href!) && item.href !== "/admin");
          
          return (
            <Link
              key={item.name}
              href={item.href!}
              className={cn(
                "group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-primary text-gray-900 font-bold shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                  : "text-gray-400 hover:bg-[#252525] hover:text-white font-medium"
              )}
            >
              <div className="flex items-center gap-3">
                {item.icon && <item.icon
                  className={cn(
                    "w-[18px] h-[18px]",
                    isActive ? "text-gray-900" : "text-gray-500 group-hover:text-white transition-colors"
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
        <span className="font-bold text-sm tracking-widest text-white uppercase text-center w-full">POS PIZZA</span>
      </div>
    </div>
  );
}
