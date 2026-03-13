"use client";

import { createContext, useContext, useMemo, useState } from "react";

type KitchenUiContextValue = {
  pendingCount: number;
  setPendingCount: (count: number) => void;
  isWsConnected: boolean;
  setIsWsConnected: (connected: boolean) => void;
  isSoundEnabled: boolean;
  setIsSoundEnabled: (enabled: boolean) => void;
};

const KitchenUiContext = createContext<KitchenUiContextValue | null>(null);

export function KitchenUiProvider({ children }: { children: React.ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const raw = window.localStorage.getItem("kds_sound_enabled");
    if (raw === null) return true;
    return raw === "1";
  });

  const setSoundEnabled = (enabled: boolean) => {
    setIsSoundEnabled(enabled);
    try {
      window.localStorage.setItem("kds_sound_enabled", enabled ? "1" : "0");
    } catch {
      // ignore
    }
  };

  const value = useMemo(
    () => ({
      pendingCount,
      setPendingCount,
      isWsConnected,
      setIsWsConnected,
      isSoundEnabled,
      setIsSoundEnabled: setSoundEnabled,
    }),
    [pendingCount, isWsConnected, isSoundEnabled],
  );

  return (
    <KitchenUiContext.Provider value={value}>
      {children}
    </KitchenUiContext.Provider>
  );
}

export function useKitchenUi() {
  const ctx = useContext(KitchenUiContext);
  if (!ctx) {
    throw new Error("useKitchenUi must be used within KitchenUiProvider");
  }
  return ctx;
}
