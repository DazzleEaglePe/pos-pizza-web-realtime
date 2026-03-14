"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Search,
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  unitOfMeasure: string;
  currentStock: number;
  minStockAlert: number;
  costPerUnit: number;
  supplier: string | null;
  isActive: boolean;
  lastUpdated: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const token = getAccessToken();
      const data = await apiFetch<InventoryItem[]>("/inventory/items", {
        token,
      });
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch inventory items", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Desactivar este insumo?")) return;
    const token = getAccessToken();
    await apiFetch(`/inventory/items/${id}`, { method: "DELETE", token });
    fetchItems();
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.sku && i.sku.toLowerCase().includes(search.toLowerCase())) ||
      (i.supplier && i.supplier.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <section className="rounded-[24px] border border-border bg-card px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              <Package className="h-3.5 w-3.5" />
              Centro de inventario
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Gestión de Insumos
            </h1>
            <p className="text-sm text-muted-foreground">
              Administra ingredientes, costos y niveles de stock del inventario.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-sm font-semibold text-sm shadow hover:opacity-90 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nuevo Insumo
          </button>
        </div>
      </section>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre, SKU o proveedor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-sm text-sm focus:ring-1 focus:ring-primary/50 outline-none text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-muted-foreground text-center py-12">
          Cargando inventario...
        </div>
      ) : (
        <div className="bg-card rounded-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Insumo
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    SKU
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                    Stock Actual
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                    Stock Mín.
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                    Costo Unit.
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Proveedor
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isLow = item.currentStock < item.minStockAlert;
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-border/50 hover:bg-muted/20 transition"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          {isLow && (
                            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                          )}
                          {item.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {item.sku || "—"}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-bold ${isLow ? "text-destructive" : "text-foreground"}`}
                      >
                        {item.currentStock.toLocaleString()}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          {item.unitOfMeasure}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {item.minStockAlert.toLocaleString()}{" "}
                        {item.unitOfMeasure}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        ${item.costPerUnit.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.supplier || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setShowForm(true);
                            }}
                            className="p-1.5 rounded-sm hover:bg-accent transition"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-sm hover:bg-destructive/10 transition"
                            title="Desactivar"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No se encontraron insumos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      {showForm && (
        <ItemFormDialog
          item={editingItem}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingItem(null);
            fetchItems();
          }}
        />
      )}
    </div>
  );
}

// ─── Item Form Dialog ──────────────────────────────────
function ItemFormDialog({
  item,
  onClose,
  onSaved,
}: {
  item: InventoryItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: item?.name || "",
    sku: item?.sku || "",
    unitOfMeasure: item?.unitOfMeasure || "g",
    currentStock: item?.currentStock ?? 0,
    minStockAlert: item?.minStockAlert ?? 0,
    costPerUnit: item?.costPerUnit ?? 0,
    supplier: item?.supplier || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = getAccessToken();
    try {
      if (item) {
        await apiFetch(`/inventory/items/${item.id}`, {
          method: "PUT",
          token,
          body: JSON.stringify(form),
          headers: { "Content-Type": "application/json" },
        });
      } else {
        await apiFetch("/inventory/items", {
          method: "POST",
          token,
          body: JSON.stringify(form),
          headers: { "Content-Type": "application/json" },
        });
      }
      onSaved();
    } catch (err) {
      console.error("Failed to save item", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-sm p-6 w-full max-w-md space-y-4 shadow-xl"
      >
        <h2 className="text-lg font-bold text-foreground">
          {item ? "Editar Insumo" : "Nuevo Insumo"}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Nombre *
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-muted border border-border rounded-sm text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                SKU
              </label>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-muted border border-border rounded-sm text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Unidad *
              </label>
              <select
                value={form.unitOfMeasure}
                onChange={(e) =>
                  setForm({ ...form, unitOfMeasure: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 bg-muted border border-border rounded-sm text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="g">Gramos (g)</option>
                <option value="kg">Kilogramos (kg)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="litros">Litros</option>
                <option value="unidades">Unidades</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Stock Actual
              </label>
              <input
                type="number"
                step="0.001"
                value={form.currentStock}
                onChange={(e) =>
                  setForm({ ...form, currentStock: parseFloat(e.target.value) || 0 })
                }
                className="w-full mt-1 px-3 py-2 bg-muted border border-border rounded-sm text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Stock Mínimo
              </label>
              <input
                type="number"
                step="0.001"
                value={form.minStockAlert}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minStockAlert: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full mt-1 px-3 py-2 bg-muted border border-border rounded-sm text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Costo Unitario ($)
              </label>
              <input
                type="number"
                step="0.001"
                value={form.costPerUnit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    costPerUnit: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full mt-1 px-3 py-2 bg-muted border border-border rounded-sm text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Proveedor
              </label>
              <input
                value={form.supplier}
                onChange={(e) =>
                  setForm({ ...form, supplier: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 bg-muted border border-border rounded-sm text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition rounded-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-sm shadow hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? "Guardando..." : item ? "Actualizar" : "Crear"}
          </button>
        </div>
      </form>
    </div>
  );
}
