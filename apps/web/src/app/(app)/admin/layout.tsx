"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { AdminRightPanel, PANEL_COLLAPSED_KEY } from "@/components/admin/admin-right-panel";
import { LoadingBar } from "@/components/ui/loading-bar";
import { NotificationListener } from "@/components/layout/notification-listener";
import { CommandPalette } from "@/components/layout/command-palette";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(PANEL_COLLAPSED_KEY) === "1";
  });

  const toggleRightPanel = useCallback(() => {
    setRightPanelCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(PANEL_COLLAPSED_KEY, next ? "1" : "0"); } catch {}
      return next;
    });
  }, []);

  // Sync across tabs
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === PANEL_COLLAPSED_KEY) setRightPanelCollapsed(e.newValue === "1");
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <LoadingBar />
      <NotificationListener />
      <CommandPalette />
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-0">
         <AdminTopbar
           rightPanelCollapsed={rightPanelCollapsed}
           onToggleRightPanel={toggleRightPanel}
         />
         <main className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-muted/20">
            {children}
         </main>
      </div>
      <AdminRightPanel
        collapsed={rightPanelCollapsed}
        onToggle={toggleRightPanel}
      />
    </div>
  );
}
