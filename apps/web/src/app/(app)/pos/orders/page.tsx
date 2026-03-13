import { cookies } from "next/headers";
import { API_URL } from "@/lib/config";
import { OrdersClient } from "./orders-client";

async function getActiveOrders() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("pos_access_token")?.value;

    const res = await fetch(`${API_URL}/orders/active`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return [];
    const data: unknown = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function OrdersPage() {
  const initialOrders = await getActiveOrders();
  return <OrdersClient initialOrders={initialOrders} />;
}
