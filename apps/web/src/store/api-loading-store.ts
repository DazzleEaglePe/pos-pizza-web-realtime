import { create } from "zustand";

type ApiLoadingState = {
  pending: number;
  inc: () => void;
  dec: () => void;
};

export const useApiLoading = create<ApiLoadingState>((set) => ({
  pending: 0,
  inc: () => set((s) => ({ pending: s.pending + 1 })),
  dec: () => set((s) => ({ pending: Math.max(0, s.pending - 1) })),
}));
