"use client";

import { useEffect, useMemo, useState } from "react";
import { UtensilsCrossed, Volume2, VolumeX } from "lucide-react";
import { KitchenUiProvider, useKitchenUi } from "./kitchen-ui-context";

export function KitchenShell({ children }: { children: React.ReactNode }) {
  return (
    <KitchenUiProvider>
      <div className="flex flex-col min-h-[100dvh] w-full bg-[#121212] text-white overflow-hidden dark">
        <KitchenHeader />
        <main className="flex-1 overflow-x-auto overflow-y-hidden p-4 sm:p-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-20 snap-x snap-mandatory scroll-px-4 sm:scroll-px-6">
          {children}
        </main>
      </div>
    </KitchenUiProvider>
  );
}

function KitchenHeader() {
  const { pendingCount, isWsConnected, isSoundEnabled, setIsSoundEnabled } =
    useKitchenUi();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const time = useMemo(
    () =>
      new Date(now).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [now],
  );

  const date = useMemo(
    () =>
      new Date(now).toLocaleDateString("es-PE", {
        weekday: "long",
        month: "short",
        day: "2-digit",
      }),
    [now],
  );

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-4 bg-[#1c1c1c] border-b border-white/5 shadow-sm z-10 gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <UtensilsCrossed className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-black text-xl tracking-tight text-white leading-none">
            Pantalla Cocina
          </h1>
          <span className="text-xs text-primary font-bold">
            Pizza &amp; Horno
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center items-end gap-2 sm:gap-6">
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              isWsConnected ? "bg-emerald-400" : "bg-red-500"
            } animate-pulse`}
            aria-hidden
          />
          <span className="text-sm font-bold">{pendingCount} Pendientes</span>

          <button
            type="button"
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="ml-2 inline-flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-[#242426] hover:bg-[#2a2a2c] transition-colors"
            aria-label={isSoundEnabled ? "Desactivar sonido" : "Activar sonido"}
            title={isSoundEnabled ? "Sonido activado" : "Sonido desactivado"}
          >
            {isSoundEnabled ? (
              <Volume2 className="w-4 h-4 text-white" />
            ) : (
              <VolumeX className="w-4 h-4 text-white/60" />
            )}
          </button>
        </div>

        <div className="text-right">
          <div className="text-xl font-bold font-mono">{time}</div>
          <div className="text-xs text-gray-400 font-medium">{date}</div>
        </div>
      </div>
    </header>
  );
}
