"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type CashRegister = {
  id: string;
  openedAt: string;
  openingAmount: number;
  status: string;
  totalSales?: number | null;
  totalCashSales?: number | null;
  totalDigitalSales?: number | null;
  totalTickets?: number | null;
  expectedCash?: number | null;
  actualCash?: number | null;
  difference?: number | null;
};

export type CashRegisterSummary = {
  id: string;
  openedAt: string;
  openingAmount: number;
  totalSales: number;
  totalCashSales: number;
  totalDigitalSales: number;
  totalTickets: number;
  expectedCash: number;
};

export function useCashRegister() {
  const [register, setRegister] = useState<CashRegister | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ register: CashRegister | null }>("/cash-register/current");
      setRegister(data.register);
    } catch {
      setRegister(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCurrent();
  }, [fetchCurrent]);

  const fetchSummary = async (): Promise<CashRegisterSummary | null> => {
    try {
      const data = await apiFetch<{ summary: CashRegisterSummary | null }>("/cash-register/summary");
      return data.summary;
    } catch {
      return null;
    }
  };

  const openRegister = async (openingAmount: number) => {
    const data = await apiFetch<{ register: CashRegister }>("/cash-register/open", {
      method: "POST",
      body: JSON.stringify({ openingAmount }),
    });
    setRegister(data.register);
    return data.register;
  };

  const closeRegister = async (actualCash: number, notes?: string) => {
    const data = await apiFetch<{ register: CashRegister }>("/cash-register/close", {
      method: "POST",
      body: JSON.stringify({ actualCash, notes }),
    });
    setRegister(null);
    return data.register;
  };

  return { register, loading, fetchCurrent, fetchSummary, openRegister, closeRegister };
}
