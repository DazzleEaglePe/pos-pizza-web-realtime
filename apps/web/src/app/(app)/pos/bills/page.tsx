import { cookies } from "next/headers";
import { API_URL } from "@/lib/config";
import { BillsClient } from "./bills-client";

async function getTransactions() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("pos_access_token")?.value;

    const res = await fetch(`${API_URL}/payments/transactions`, {
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

export default async function PosBillsPage() {
  const initialTransactions = await getTransactions();
  return <BillsClient initialTransactions={initialTransactions} />;
}
