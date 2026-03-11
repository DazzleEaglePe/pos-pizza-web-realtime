import { CartSidebar } from "@/components/pos/cart-sidebar";
import { MenuDisplay } from "@/components/pos/menu-display";
import { MobileCartButton } from "@/components/pos/mobile-cart-button";
import { cookies } from 'next/headers';

async function getCatalog() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("pos_access_token")?.value;

    const res = await fetch('http://localhost:3001/catalog', { 
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    console.error("Failed to fetch catalog:", e);
    return [];
  }
}

export default async function POSPage() {
  const catalog = await getCatalog();

  return (
    <div className="flex w-full h-full pb-4 gap-6 relative">
      {/* Left Area - Dynamic POS Grid & Filters */}
      <MenuDisplay catalog={catalog} />

      {/* Right Area - Cart Sidebar (Desktop Only) */}
      <div className="hidden lg:block h-[calc(100%+2.5rem)] -mt-2 -mb-8 w-[380px] -mr-8 overflow-hidden bg-background z-10 shrink-0">
        <CartSidebar />
      </div>

      {/* Mobile Floating Cart Button */}
      <MobileCartButton />
    </div>
  );
}
