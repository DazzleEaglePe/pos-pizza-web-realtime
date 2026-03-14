"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { BookOpen, Plus, Trash2 } from "lucide-react";

interface RecipeRow {
  id: string;
  productId: string;
  variantId: string | null;
  inventoryItemId: string;
  quantityRequired: number;
  product?: { id: string; name: string };
  variant?: { id: string; name: string } | null;
  inventoryItem?: { id: string; name: string; unitOfMeasure: string };
}

interface InventoryItemOption {
  id: string;
  name: string;
  unitOfMeasure: string;
}

interface CatalogProduct {
  id: string;
  name: string;
  variants: Array<{ id: string; name: string }>;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [items, setItems] = useState<InventoryItemOption[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchAll = useCallback(async () => {
    const token = getAccessToken();
    const [r, i, catalog] = await Promise.all([
      apiFetch<RecipeRow[]>("/inventory/recipes", { token }),
      apiFetch<InventoryItemOption[]>("/inventory/items", { token }),
      apiFetch<Array<{ products: CatalogProduct[] }>>("/catalog", { token }),
    ]);
    setRecipes(r);
    setItems(i);
    const allProducts = catalog.flatMap((cat) =>
      cat.products.map((p) => ({
        id: p.id,
        name: p.name,
        variants: Array.isArray(p.variants) ? p.variants : [],
      }))
    );
    setProducts(allProducts);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este ingrediente de la receta?")) return;
    const token = getAccessToken();
    await apiFetch(`/inventory/recipes/${id}`, { method: "DELETE", token });
    fetchAll();
  };

  // Group by product
  const grouped = recipes.reduce(
    (acc, r) => {
      const key = r.product?.name || r.productId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    },
    {} as Record<string, RecipeRow[]>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Recetas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define qué insumos usa cada producto y en qué cantidad
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm shadow hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Agregar Ingrediente
        </button>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-center py-12">
          Cargando recetas...
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No hay recetas configuradas. Agrega ingredientes a los productos.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([productName, rows]) => (
            <div
              key={productName}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              <div className="px-4 py-3 bg-muted/30 border-b border-border">
                <h3 className="font-bold text-foreground">{productName}</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-4 py-2 font-semibold text-muted-foreground">
                      Variante
                    </th>
                    <th className="text-left px-4 py-2 font-semibold text-muted-foreground">
                      Ingrediente
                    </th>
                    <th className="text-right px-4 py-2 font-semibold text-muted-foreground">
                      Cantidad
                    </th>
                    <th className="text-center px-4 py-2 font-semibold text-muted-foreground">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border/30 hover:bg-muted/20 transition"
                    >
                      <td className="px-4 py-2 text-muted-foreground">
                        {r.variant?.name || "Todas"}
                      </td>
                      <td className="px-4 py-2 font-medium text-foreground">
                        {r.inventoryItem?.name || r.inventoryItemId}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-foreground">
                        {r.quantityRequired}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          {r.inventoryItem?.unitOfMeasure}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <RecipeFormDialog
          products={products}
          items={items}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchAll();
          }}
        />
      )}
    </div>
  );
}

function RecipeFormDialog({
  products,
  items,
  onClose,
  onSaved,
}: {
  products: CatalogProduct[];
  items: InventoryItemOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [ingredients, setIngredients] = useState([
    { inventoryItemId: "", quantityRequired: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  const selectedProduct = products.find((p) => p.id === productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = getAccessToken();
    try {
      await apiFetch("/inventory/recipes", {
        method: "POST",
        token,
        body: JSON.stringify({
          productId,
          variantId: variantId || undefined,
          ingredients: ingredients.filter(
            (i) => i.inventoryItemId && i.quantityRequired > 0
          ),
        }),
        headers: { "Content-Type": "application/json" },
      });
      onSaved();
    } catch (err) {
      console.error("Failed to create recipe", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-lg font-bold text-foreground">
          Agregar Ingredientes a Receta
        </h2>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">
            Producto *
          </label>
          <select
            required
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setVariantId("");
            }}
            className="w-full mt-1 px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground outline-none"
          >
            <option value="">Seleccionar producto...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {selectedProduct && selectedProduct.variants.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Variante (opcional)
            </label>
            <select
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground outline-none"
            >
              <option value="">Todas las variantes</option>
              {selectedProduct.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Ingredientes
          </label>
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1">
                <select
                  value={ing.inventoryItemId}
                  onChange={(e) => {
                    const copy = [...ingredients];
                    copy[i].inventoryItemId = e.target.value;
                    setIngredients(copy);
                  }}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground outline-none"
                >
                  <option value="">Seleccionar insumo...</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} ({it.unitOfMeasure})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-28">
                <input
                  type="number"
                  step="0.001"
                  placeholder="Cantidad"
                  value={ing.quantityRequired || ""}
                  onChange={(e) => {
                    const copy = [...ingredients];
                    copy[i].quantityRequired =
                      parseFloat(e.target.value) || 0;
                    setIngredients(copy);
                  }}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground outline-none"
                />
              </div>
              {ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setIngredients(ingredients.filter((_, idx) => idx !== i))
                  }
                  className="p-2 rounded-lg hover:bg-destructive/10 transition"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setIngredients([
                ...ingredients,
                { inventoryItemId: "", quantityRequired: 0 },
              ])
            }
            className="text-xs text-primary font-semibold hover:underline"
          >
            + Agregar ingrediente
          </button>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition rounded-xl"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Receta"}
          </button>
        </div>
      </form>
    </div>
  );
}
