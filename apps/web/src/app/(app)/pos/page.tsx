import { CartSidebar } from "@/components/pos/cart-sidebar";
import { MenuDisplay } from "@/components/pos/menu-display";
import { MobileCartButton } from "@/components/pos/mobile-cart-button";
import { cookies } from "next/headers";
import { API_URL } from "@/lib/config";

async function getCatalog() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("pos_access_token")?.value;

    const res = await fetch(`${API_URL}/catalog`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
    <div className="flex w-full h-full gap-6 relative pl-4">
      {/* Left Area - Dynamic POS Grid & Filters */}
      <MenuDisplay catalog={catalog} />

      {/* Right Area - Cart Sidebar (Desktop Only) */}
      <div className="hidden lg:block h-full w-[380px] overflow-hidden bg-background z-10 shrink-0">
        <CartSidebar />
      </div>

      {/* Mobile Floating Cart Button */}
      <MobileCartButton />
    </div>
  );
}
