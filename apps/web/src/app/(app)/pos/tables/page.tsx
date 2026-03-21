"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { WS_URL } from "@/lib/config";
import { isUnauthorized, handleSessionExpired } from "@/lib/api-error-handler";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { LayoutGrid, Users, RefreshCw } from "lucide-react";

/* ─── Types ───────────────────────────────────────────── */

interface Table {
  id: string;
  number: number;
  capacity: number;
  zone: string | null;
  status: string;
  isActive: boolean;
}

interface TableStatusEvent {
  id: string;
  number: number;
  status: string;
}

/* ─── Status config ───────────────────────────────────── */

const STATUS_STYLE: Record<string, { bg: string; ring: string; label: string }> = {
  AVAILABLE: { bg: "bg-emerald-500/15", ring: "ring-emerald-500/40", label: "Disponible" },
  OCCUPIED: { bg: "bg-red-500/15", ring: "ring-red-500/40", label: "Ocupada" },
  RESERVED: { bg: "bg-amber-500/15", ring: "ring-amber-500/40", label: "Reservada" },
};

const STATUS_DOT: Record<string, string> = {
  AVAILABLE: "bg-emerald-500",
  OCCUPIED: "bg-red-500",
  RESERVED: "bg-amber-500",
};

/* ─── Component ───────────────────────────────────────── */

export default function POSTablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const socketRef = useRef<Socket | null>(null);

  const fetchTables = useCallback(async () => {
    try {
      const token = getAccessToken();
      const data = await apiFetch<Table[]>("/tables/all", { token });
      setTables(data.filter((t2) => t2.isActive));
    } catch (err) {
      if (isUnauthorized(err)) {
        handleSessionExpired();
        return;
      }
      console.error("Failed to fetch tables", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTables();
  }, [fetchTables]);

  /* WebSocket: listen for table status changes */
  useEffect(() => {
    const socket = io(`${WS_URL}/pos`, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on("table:statusUpdated", (evt: TableStatusEvent) => {
      setTables((prev) =>
        prev.map((t2) => (t2.id === evt.id ? { ...t2, status: evt.status } : t2)),
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const zones = Array.from(new Set(tables.map((t2) => t2.zone).filter(Boolean))) as string[];

  const filtered = filter === "ALL" ? tables : tables.filter((t2) => t2.status === filter);

  const counts = {
    ALL: tables.length,
    AVAILABLE: tables.filter((t2) => t2.status === "AVAILABLE").length,
    OCCUPIED: tables.filter((t2) => t2.status === "OCCUPIED").length,
    RESERVED: tables.filter((t2) => t2.status === "RESERVED").length,
  };

  if (loading) return <PageSkeleton variant="cards" cards={12} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-primary" />
            Mapa de Mesas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Estado en tiempo real de las mesas del salón
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); void fetchTables(); }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-muted hover:bg-accent transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "AVAILABLE", "OCCUPIED", "RESERVED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
              filter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {s === "ALL" ? "Todas" : STATUS_STYLE[s]?.label ?? s}{" "}
            <span className="ml-1 opacity-70">({counts[s]})</span>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        {Object.entries(STATUS_STYLE).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[key]}`} />
            {val.label}
          </div>
        ))}
      </div>

      {/* Grid by zone */}
      {zones.length > 0 ? (
        zones.map((zone) => {
          const zoneTables = filtered.filter((t2) => t2.zone === zone);
          if (zoneTables.length === 0) return null;
          return (
            <div key={zone} className="space-y-3">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                {zone}
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {zoneTables.map((table) => (
                  <TableCard key={table.id} table={table} />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filtered.map((table) => (
            <TableCard key={table.id} table={table} />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          No hay mesas con el filtro seleccionado.
        </p>
      )}
    </div>
  );
}

/* ─── Table Card ──────────────────────────────────────── */

function TableCard({ table }: { table: Table }) {
  const style = STATUS_STYLE[table.status] ?? STATUS_STYLE.AVAILABLE;
  const dot = STATUS_DOT[table.status] ?? STATUS_DOT.AVAILABLE;

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl p-4 ring-1 ${style.bg} ${style.ring} transition-all duration-300`}
    >
      <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${dot} animate-pulse`} />
      <span className="text-2xl font-bold">{table.number}</span>
      <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
        <Users className="w-3 h-3" />
        {table.capacity}
      </div>
      <span className="text-[10px] font-semibold mt-1 uppercase tracking-wide opacity-70">
        {style.label}
      </span>
    </div>
  );
}
