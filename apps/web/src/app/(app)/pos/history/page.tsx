import { cookies } from "next/headers";
import { API_URL } from "@/lib/config";
import { HistoryClient } from "./history-client";

async function getOrders() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("pos_access_token")?.value;

    const res = await fetch(`${API_URL}/orders`, {
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

export default async function PosHistoryPage() {
  const initialOrders = await getOrders();
  return <HistoryClient initialOrders={initialOrders} />;
}
