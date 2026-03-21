"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { LoadingBar } from "@/components/ui/loading-bar";
import { NotificationListener } from "@/components/layout/notification-listener";
import { CartSidebar } from "@/features/pos/cart";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CommandPalette } from "@/components/layout/command-palette";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/kitchen")) {
    return <>{children}</>;
  }

  // Help page — minimal shell without POS components
  if (pathname.startsWith("/help")) {
    return (
      <>
        <CommandPalette />
        {children}
      </>
    );
  }

  return (
    <div className="flex h-screen w-full">
      <LoadingBar />
      <NotificationListener />
      <CommandPalette />
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 pb-14 lg:pb-0">{children}</main>
      </div>
      {/* Cart Sidebar — full viewport height, beside the content column */}
      <div className="hidden lg:flex h-full w-95 shrink-0">
        <CartSidebar />
      </div>
      {/* Bottom navigation for mobile/tablet */}
      <BottomNav />
    </div>
  );
}
