import { create } from "zustand";
import { apiFetch } from "@/lib/api";

interface ConfigState {
  taxRate: number; // percentage, e.g. 18
  loaded: boolean;
  fetchConfig: () => Promise<void>;
}

export const useConfig = create<ConfigState>((set, get) => ({
  taxRate: 18,
  loaded: false,

  fetchConfig: async () => {
    if (get().loaded) return;
    try {
      const data = await apiFetch("/config");
      set({ taxRate: data.taxRate ?? 18, loaded: true });
    } catch {
      // Fallback to default 18% if fetch fails
      set({ loaded: true });
    }
  },
}));
