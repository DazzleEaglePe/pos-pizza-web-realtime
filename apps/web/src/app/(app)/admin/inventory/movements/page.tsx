"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { ArrowDownUp } from "lucide-react";

interface Movement {
  id: string;
  inventoryItemId: string;
  movementType: string;
  quantity: number;
  stockAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  userId: string | null;
  createdAt: string;
}

interface InventoryItem {
  id: string;
  name: string;
  unitOfMeasure: string;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  IN: { label: "Entrada", color: "text-green-500" },
  OUT: { label: "Salida", color: "text-destructive" },
  ADJUSTMENT: { label: "Ajuste", color: "text-yellow-500" },
  RETURN: { label: "Devolución", color: "text-blue-500" },
};

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterItem, setFilterItem] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadMovements = async () => {
      const token = getAccessToken();
      const params = new URLSearchParams();
      if (filterItem) params.set("inventoryItemId", filterItem);
      if (filterType) params.set("movementType", filterType);
      params.set("limit", "200");

      const [m, i] = await Promise.all([
        apiFetch<Movement[]>(`/inventory/movements?${params}`, { token }),
        apiFetch<InventoryItem[]>('/inventory/items', { token }),
      ]);

      if (cancelled) return;

      setMovements(m);
      setItems(i);
      setLoading(false);
    };

    void loadMovements();

    return () => {
      cancelled = true;
    };
  }, [filterItem, filterType]);

  const getItemName = (id: string) =>
    items.find((i) => i.id === id)?.name || id.slice(0, 8);

  return (
    <div className="p-6 space-y-6">
      <section className="rounded-[24px] border border-border bg-card px-6 py-6">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            <ArrowDownUp className="h-3.5 w-3.5" />
            Centro de inventario
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ArrowDownUp className="w-6 h-6 text-primary" />
            Historial de Movimientos
          </h1>
          <p className="text-sm text-muted-foreground">
            Revisa entradas, salidas y ajustes para trazabilidad de stock.
          </p>
        </div>
      </section>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterItem}
          onChange={(e) => setFilterItem(e.target.value)}
          className="px-3 py-2 bg-card border border-border rounded-sm text-sm text-foreground outline-none"
        >
          <option value="">Todos los insumos</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 bg-card border border-border rounded-sm text-sm text-foreground outline-none"
        >
          <option value="">Todos los tipos</option>
          <option value="IN">Entrada</option>
          <option value="OUT">Salida</option>
          <option value="ADJUSTMENT">Ajuste</option>
          <option value="RETURN">Devolución</option>
        </select>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-center py-12">
          Cargando movimientos...
        </div>
      ) : (
        <div className="bg-card rounded-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Fecha
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Insumo
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
                    Tipo
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                    Cantidad
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                    Stock Después
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Referencia
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Notas
                  </th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const tl = TYPE_LABELS[m.movementType] || {
                    label: m.movementType,
                    color: "text-muted-foreground",
                  };
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-border/30 hover:bg-muted/20 transition"
                    >
                      <td className="px-4 py-2 text-muted-foreground text-xs">
                        {new Date(m.createdAt).toLocaleString("es-MX", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-2 font-medium text-foreground">
                        {getItemName(m.inventoryItemId)}
                      </td>
                      <td className={`px-4 py-2 text-center font-bold ${tl.color}`}>
                        {tl.label}
                      </td>
                      <td
                        className={`px-4 py-2 text-right font-bold ${m.quantity >= 0 ? "text-green-500" : "text-destructive"}`}
                      >
                        {m.quantity >= 0 ? "+" : ""}
                        {m.quantity}
                      </td>
                      <td className="px-4 py-2 text-right text-muted-foreground">
                        {m.stockAfter}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {m.referenceType || "—"}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground max-w-50 truncate">
                        {m.notes || "—"}
                      </td>
                    </tr>
                  );
                })}
                {movements.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No hay movimientos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
