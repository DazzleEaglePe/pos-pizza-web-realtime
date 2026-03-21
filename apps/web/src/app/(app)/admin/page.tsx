import { cookies } from "next/headers";
import { API_URL } from "@/lib/config";
import { DashboardContent, type DashboardData } from "@/components/admin/dashboard-content";

type CatalogProduct = {
   isActive: boolean;
   variants?: unknown[];
   modifierGroups?: unknown[];
};

type CatalogCategory = {
   id: string;
   name: string;
   isActive: boolean;
   products: CatalogProduct[];
};

type ModifierGroup = {
   isActive: boolean;
   modifiers: unknown[];
};

type InventoryItem = {
   isActive: boolean;
};

type AlertItem = {
   id: string;
   name: string;
   shortage: number;
   unitOfMeasure: string;
   urgency: "critical" | "warning";
};

type Promotion = {
   isActive: boolean;
};

async function fetchData<T>(path: string, token: string | undefined) {
   try {
      const res = await fetch(`${API_URL}${path}`, {
         cache: "no-store",
         headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) return null;
      return (await res.json()) as T;
   } catch {
      return null;
   }
}

export default async function AdminPage() {
   const cookieStore = await cookies();
   const token = cookieStore.get("pos_access_token")?.value;

   const [catalog, modGroups, invItems, alerts, promos] = await Promise.all([
      fetchData<CatalogCategory[]>("/catalog/admin", token),
      fetchData<ModifierGroup[]>("/catalog/modifier-groups", token),
      fetchData<InventoryItem[]>("/inventory/items", token),
      fetchData<AlertItem[]>("/inventory/alerts", token),
      fetchData<Promotion[]>("/promotions/all", token),
   ]);

   const categories = catalog ?? [];
   const groups = modGroups ?? [];
   const stockItems = invItems ?? [];
   const stockAlerts = alerts ?? [];
   const comboList = promos ?? [];

   const allProducts = categories.flatMap((c) => c.products);

   const categoryBreakdown = categories
      .filter((c) => c.isActive)
      .map((c) => ({
         name: c.name,
         count: c.products.length,
         active: c.products.filter((p) => p.isActive).length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

   const data: DashboardData = {
      activeCategories: categories.filter((c) => c.isActive).length,
      activeProducts: allProducts.filter((p) => p.isActive).length,
      totalProducts: allProducts.length,
      variantCount: allProducts.reduce((t, p) => t + (p.variants?.length ?? 0), 0),
      activeModifierGroups: groups.filter((g) => g.isActive).length,
      activeModifiers: groups.reduce((t, g) => t + g.modifiers.length, 0),
      assignedModifierGroups: allProducts.reduce((t, p) => t + (p.modifierGroups?.length ?? 0), 0),
      activeInventory: stockItems.filter((i) => i.isActive).length,
      activePromotions: comboList.filter((p) => p.isActive).length,
      totalPromotions: comboList.length,
      stockAlerts,
      categoryBreakdown,
   };

   return <DashboardContent data={data} />;
}
