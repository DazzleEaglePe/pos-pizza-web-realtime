"use client";

import { useCart } from "@/hooks/useCart";
import { ShoppingBag } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from "@/components/ui/drawer";
import { CartSidebar } from "@/features/pos/cart";

export function MobileCartButton() {
  const { items } = useCart();
  
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  if (totalItems === 0) return null;

  return (
    <div className="lg:hidden fixed bottom-[4.5rem] left-0 right-0 flex justify-center z-50 pointer-events-none px-4">
      <Drawer>
        <DrawerTrigger asChild>
          <button className="pointer-events-auto bg-primary text-primary-foreground shadow-xl rounded-sm px-6 py-3.5 flex items-center gap-3 font-bold text-base hover:scale-105 active:scale-95 transition-all w-full max-w-sm justify-center">
            <ShoppingBag className="w-5 h-5" />
            <span>Ver Pedido ({totalItems})</span>
          </button>
        </DrawerTrigger>
        <DrawerContent className="h-[85vh] bg-background border-border flex flex-col p-0">
          <DrawerTitle className="sr-only">Your Cart</DrawerTitle>
          <div className="flex-1 overflow-hidden relative">
            <CartSidebar />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
