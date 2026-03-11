"use client";

import { Menu } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from "@/components/ui/drawer";
import { Sidebar } from "./sidebar";
import { useState } from "react";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden flex items-center mr-2">
      <Drawer open={open} onOpenChange={setOpen} direction="left">
        <DrawerTrigger asChild>
          <button className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </button>
        </DrawerTrigger>
        <DrawerContent className="w-64 h-full bg-background border-r border-border rounded-none p-0 flex flex-col">
          <DrawerTitle className="sr-only">Navigation Menu</DrawerTitle>
          {/* Reuse the Sidebar but without the fixed responsive classes */}
          <Sidebar className="flex lg:flex w-full h-full border-none shadow-none" onNavigate={() => setOpen(false)} />
        </DrawerContent>
      </Drawer>
    </div>
  );
}
