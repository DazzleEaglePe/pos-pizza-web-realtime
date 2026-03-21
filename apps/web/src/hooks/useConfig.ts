import { create } from "zustand";
import { apiFetch } from "@/lib/api";
import { getCurrencySymbol } from "@/lib/latam-data";
import { isUnauthorized, handleSessionExpired } from "@/lib/api-error-handler";

interface ConfigState {
  taxRate: number; // percentage, e.g. 18
  currency: string; // ISO code, e.g. "PEN"
  currencySymbol: string; // display symbol, e.g. "S/"
  loaded: boolean;
  fetchConfig: () => Promise<void>;
  reloadConfig: () => Promise<void>;
  setTaxRate: (taxRate: number) => void;
  setCurrency: (code: string) => void;
}

export const useConfig = create<ConfigState>((set, get) => ({
  taxRate: 18,
  currency: "PEN",
  currencySymbol: "S/",
  loaded: false,

  fetchConfig: async () => {
    if (get().loaded) return;
    try {
      const data = await apiFetch<{ taxRate?: number; currency?: string }>("/config");
      const code = data.currency ?? "PEN";
      set({
        taxRate: data.taxRate ?? 18,
        currency: code,
        currencySymbol: getCurrencySymbol(code),
        loaded: true,
      });
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      set({ loaded: true });
    }
  },

  reloadConfig: async () => {
    set({ loaded: false });
    await get().fetchConfig();
  },

  setTaxRate: (taxRate) => set({ taxRate }),

  setCurrency: (code) =>
    set({ currency: code, currencySymbol: getCurrencySymbol(code) }),
}));
