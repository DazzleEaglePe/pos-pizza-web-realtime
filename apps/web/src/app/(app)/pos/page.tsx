import { MenuDisplay } from "@/features/pos/menu";
import { MobileCartButton } from "@/components/pos/mobile-cart-button";
import { cookies } from "next/headers";
import { API_URL } from "@/lib/config";

async function getCategories() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("pos_access_token")?.value;

    const res = await fetch(`${API_URL}/catalog/categories`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    console.error("Failed to fetch categories:", e);
    return [];
  }
}

async function getPromotions() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("pos_access_token")?.value;

    const res = await fetch(`${API_URL}/promotions`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    console.error("Failed to fetch promotions:", e);
    return [];
  }
}

export default async function POSPage() {
  const [categories, promotions] = await Promise.all([getCategories(), getPromotions()]);

  return (
    <div className="flex w-full h-full min-w-0 relative overflow-x-hidden px-3 sm:px-4">
      {/* Left Area - Dynamic POS Grid & Filters */}
      <MenuDisplay categories={categories} promotions={promotions} />

      {/* Mobile Floating Cart Button */}
      <MobileCartButton />
    </div>
  );
}
