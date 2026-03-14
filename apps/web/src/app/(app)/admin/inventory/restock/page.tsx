"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { PackagePlus } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  unitOfMeasure: string;
  currentStock: number;
}

export default function RestockPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ name: string; newStock: number; unit: string } | null>(null);

  const fetchItems = useCallback(async () => {
    const token = getAccessToken();
    const data = await apiFetch<InventoryItem[]>("/inventory/items", { token });
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const selectedItem = items.find((i) => i.id === selectedId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || quantity <= 0) return;
    setSaving(true);
    setResult(null);
    const token = getAccessToken();
    try {
      const res = await apiFetch<{ item: InventoryItem }>("/inventory/restock", {
        method: "POST",
        token,
        body: JSON.stringify({
          inventoryItemId: selectedId,
          quantity,
          supplier: supplier || undefined,
          notes: notes || undefined,
        }),
        headers: { "Content-Type": "application/json" },
      });
      setResult({
        name: res.item.name,
        newStock: res.item.currentStock,
        unit: res.item.unitOfMeasure,
      });
      setQuantity(0);
      setNotes("");
      fetchItems();
    } catch (err) {
      console.error("Restock failed", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <PackagePlus className="w-6 h-6 text-primary" />
          Reposición de Inventario
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registra la entrada de mercancía al inventario
        </p>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Cargando...</div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Insumo *</label>
            <select
              required
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground outline-none"
            >
              <option value="">Seleccionar insumo...</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} (stock: {i.currentStock} {i.unitOfMeasure})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Cantidad a agregar ({selectedItem?.unitOfMeasure || "unidades"}) *
            </label>
            <input
              type="number"
              required
              min="0.001"
              step="0.001"
              value={quantity || ""}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="w-full mt-1 px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Proveedor</label>
            <input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Nombre del proveedor"
              className="w-full mt-1 px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Factura, lote, observaciones..."
              rows={2}
              className="w-full mt-1 px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? "Registrando..." : "Registrar Entrada"}
          </button>

          {result && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm text-foreground">
              <span className="font-bold text-primary">Entrada registrada.</span>{" "}
              {result.name} ahora tiene{" "}
              <span className="font-bold">{result.newStock.toLocaleString()} {result.unit}</span>{" "}
              en stock.
            </div>
          )}
        </form>
      )}
    </div>
  );
}
