"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { WS_URL } from "@/lib/config";
import { isUnauthorized, handleSessionExpired } from "@/lib/api-error-handler";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { LayoutGrid, Users, RefreshCw } from "lucide-react";
import { PosPageHeader } from "@pos-pizza/ui";

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

const tableCardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0, 0, 0.2, 1] as const } },
};

const tableGridVariants = {
  visible: { transition: { staggerChildren: 0.03 } },
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
    <div className="max-w-6xl mx-auto px-6 py-8">
      <PosPageHeader
        icon={<LayoutGrid className="w-5 h-5 text-primary" />}
        title="Mapa de Mesas"
        description="Estado en tiempo real de las mesas del salón"
      >
        <button
          onClick={() => { setLoading(true); void fetchTables(); }}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-primary/10 text-primary border border-primary/15 font-black text-xs uppercase tracking-widest hover:bg-primary/15 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </button>
      </PosPageHeader>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["ALL", "AVAILABLE", "OCCUPIED", "RESERVED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-colors border ${
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
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
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
              <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest">
                {zone}
              </h2>
              <motion.div
                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3"
                variants={tableGridVariants}
                initial="hidden"
                animate="visible"
              >
                {zoneTables.map((table) => (
                  <motion.div key={table.id} variants={tableCardVariants}>
                    <TableCard table={table} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          );
        })
      ) : (
        <motion.div
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3"
          variants={tableGridVariants}
          initial="hidden"
          animate="visible"
        >
          {filtered.map((table) => (
            <motion.div key={table.id} variants={tableCardVariants}>
              <TableCard table={table} />
            </motion.div>
          ))}
        </motion.div>
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
      className={`relative flex flex-col items-center justify-center rounded-sm p-5 ring-1 ${style.bg} ${style.ring} transition-all duration-300 h-full`}
    >
      <span className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full ${dot} animate-pulse`} />
      <span className="text-2xl font-black">{table.number}</span>
      <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
        <Users className="w-3 h-3" />
        {table.capacity}
      </div>
      <span className="text-[10px] font-black mt-1 uppercase tracking-wide opacity-70">
        {style.label}
      </span>
    </div>
  );
}
