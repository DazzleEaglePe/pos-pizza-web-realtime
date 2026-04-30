import { Dispatch, SetStateAction, useState } from "react";
import { Pencil, Plus, Trash2, Timer } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useConfig } from "@/hooks/useConfig";
import {
  Category,
  Modifier,
  ModifierDraft,
  ModifierGroup,
  ModifierGroupForm,
  Product,
  ProductForm,
  Variant,
  VariantDraft,
} from "./types";

type ProductsSectionProps = {
  catalog: Category[];
  allProducts: Product[];
  productForm: ProductForm;
  setProductForm: Dispatch<SetStateAction<ProductForm>>;
  submitProduct: () => Promise<void>;
  disableProduct: (id: string) => Promise<void>;
  variantDraftByProduct: Record<string, VariantDraft>;
  setVariantDraftByProduct: Dispatch<SetStateAction<Record<string, VariantDraft>>>;
  createVariant: (productId: string) => Promise<void>;
  editVariant: (variant: Variant) => Promise<void>;
  disableVariant: (variantId: string) => Promise<void>;
  modifierGroups: ModifierGroup[];
  modifierGroupForm: ModifierGroupForm;
  setModifierGroupForm: Dispatch<SetStateAction<ModifierGroupForm>>;
  submitModifierGroup: () => Promise<void>;
  disableModifierGroup: (groupId: string) => Promise<void>;
  modifierDraftByGroup: Record<string, ModifierDraft>;
  setModifierDraftByGroup: Dispatch<SetStateAction<Record<string, ModifierDraft>>>;
  createModifier: (groupId: string) => Promise<void>;
  editModifier: (modifier: Modifier) => Promise<void>;
  disableModifier: (modifierId: string) => Promise<void>;
  assignGroupByProduct: Record<string, string>;
  setAssignGroupByProduct: Dispatch<SetStateAction<Record<string, string>>>;
  assignModifierGroup: (productId: string) => Promise<void>;
  removeModifierGroupFromProduct: (
    productId: string,
    modifierGroupId: string,
  ) => Promise<void>;
};

export function ProductsSection({
  catalog,
  allProducts,
  productForm,
  setProductForm,
  submitProduct,
  disableProduct,
  variantDraftByProduct,
  setVariantDraftByProduct,
  createVariant,
  editVariant,
  disableVariant,
  modifierGroups,
  modifierGroupForm,
  setModifierGroupForm,
  submitModifierGroup,
  disableModifierGroup,
  modifierDraftByGroup,
  setModifierDraftByGroup,
  createModifier,
  editModifier,
  disableModifier,
  assignGroupByProduct,
  setAssignGroupByProduct,
  assignModifierGroup,
  removeModifierGroupFromProduct,
}: ProductsSectionProps) {
  const cs = useConfig((s) => s.currencySymbol);
  return (
    <>
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-black text-foreground">
          {productForm.id ? "Editar producto" : "Nuevo producto"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={productForm.categoryId}
            onChange={(e) => setProductForm((s) => ({ ...s, categoryId: e.target.value }))}
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
          >
            {catalog.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            value={productForm.name}
            onChange={(e) => setProductForm((s) => ({ ...s, name: e.target.value }))}
            placeholder="Nombre"
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
          />
          <input
            type="number"
            step="0.01"
            value={productForm.basePrice}
            onChange={(e) =>
              setProductForm((s) => ({ ...s, basePrice: Number(e.target.value || 0) }))
            }
            placeholder="Precio base"
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
          />
          <button
            type="button"
            onClick={() => void submitProduct()}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-full text-[11px] font-black uppercase tracking-widest"
          >
            <span className="inline-flex items-center gap-1">
              <Plus className="w-4 h-4" />
              {productForm.id ? "Actualizar" : "Crear"}
            </span>
          </button>
          <input
            value={productForm.description}
            onChange={(e) => setProductForm((s) => ({ ...s, description: e.target.value }))}
            placeholder="Descripción"
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm md:col-span-2"
          />
          <input
            value={productForm.imageUrl}
            onChange={(e) => setProductForm((s) => ({ ...s, imageUrl: e.target.value }))}
            placeholder="URL de imagen"
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm md:col-span-2"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-black text-foreground">
          {modifierGroupForm.id ? "Editar grupo de modificadores" : "Nuevo grupo de modificadores"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            value={modifierGroupForm.name}
            onChange={(e) => setModifierGroupForm((s) => ({ ...s, name: e.target.value }))}
            placeholder="Nombre del grupo"
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
          />
          <input
            type="number"
            value={modifierGroupForm.minSelections}
            onChange={(e) =>
              setModifierGroupForm((s) => ({ ...s, minSelections: Number(e.target.value || 0) }))
            }
            placeholder="Mínimo"
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
          />
          <input
            type="number"
            value={modifierGroupForm.maxSelections}
            onChange={(e) =>
              setModifierGroupForm((s) => ({ ...s, maxSelections: Number(e.target.value || 99) }))
            }
            placeholder="Máximo"
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
          />
          <input
            type="number"
            value={modifierGroupForm.displayOrder}
            onChange={(e) =>
              setModifierGroupForm((s) => ({ ...s, displayOrder: Number(e.target.value || 0) }))
            }
            placeholder="Orden"
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
          />
          <button
            type="button"
            onClick={() => void submitModifierGroup()}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-full text-[11px] font-black uppercase tracking-widest"
          >
            <span className="inline-flex items-center gap-1">
              <Plus className="w-4 h-4" />
              {modifierGroupForm.id ? "Actualizar" : "Crear"}
            </span>
          </button>
          <input
            value={modifierGroupForm.description}
            onChange={(e) =>
              setModifierGroupForm((s) => ({ ...s, description: e.target.value }))
            }
            placeholder="Descripción"
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm md:col-span-5"
          />
        </div>

        <div className="space-y-3">
          {modifierGroups.map((group) => (
            <div key={group.id} className="rounded-xl border border-border p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-sm text-foreground">{group.name}</p>
                  <p className="text-xs text-muted-foreground">
                    min {group.minSelections} · max {group.maxSelections}
                  </p>
                  {group.description && (
                    <p className="text-xs text-muted-foreground mt-1">{group.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setModifierGroupForm({
                        id: group.id,
                        name: group.name,
                        description: group.description ?? "",
                        minSelections: group.minSelections,
                        maxSelections: group.maxSelections,
                        displayOrder: group.displayOrder,
                      })
                    }
                    className="p-1.5 rounded-lg hover:bg-accent"
                    title="Editar grupo"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => void disableModifierGroup(group.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10"
                    title="Desactivar grupo"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                {group.modifiers.map((modifier) => (
                  <div
                    key={modifier.id}
                    className="flex items-center justify-between px-2 py-1.5 rounded-xl border border-border/60 bg-background/50"
                  >
                    <span className="text-xs text-foreground">
                      {modifier.name} · {cs}{Number(modifier.price).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => void editModifier(modifier)}
                        className="p-1 rounded-lg hover:bg-accent"
                      >
                        <Pencil className="w-3 h-3 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => void disableModifier(modifier.id)}
                        className="p-1 rounded-lg hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <input
                  value={modifierDraftByGroup[group.id]?.name ?? ""}
                  onChange={(e) =>
                    setModifierDraftByGroup((prev) => ({
                      ...prev,
                      [group.id]: {
                        name: e.target.value,
                        price: prev[group.id]?.price ?? 0,
                        displayOrder: prev[group.id]?.displayOrder ?? 0,
                      },
                    }))
                  }
                  placeholder="Nuevo modificador"
                  className="px-3 py-2 rounded-xl border border-border bg-background text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  value={modifierDraftByGroup[group.id]?.price ?? 0}
                  onChange={(e) =>
                    setModifierDraftByGroup((prev) => ({
                      ...prev,
                      [group.id]: {
                        name: prev[group.id]?.name ?? "",
                        price: Number(e.target.value || 0),
                        displayOrder: prev[group.id]?.displayOrder ?? 0,
                      },
                    }))
                  }
                  placeholder="Precio"
                  className="px-3 py-2 rounded-xl border border-border bg-background text-sm"
                />
                <input
                  type="number"
                  value={modifierDraftByGroup[group.id]?.displayOrder ?? 0}
                  onChange={(e) =>
                    setModifierDraftByGroup((prev) => ({
                      ...prev,
                      [group.id]: {
                        name: prev[group.id]?.name ?? "",
                        price: prev[group.id]?.price ?? 0,
                        displayOrder: Number(e.target.value || 0),
                      },
                    }))
                  }
                  placeholder="Orden"
                  className="px-3 py-2 rounded-xl border border-border bg-background text-sm"
                />
                <button
                  onClick={() => void createModifier(group.id)}
                  className="px-3 py-2 rounded-full bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-widest"
                >
                  Agregar modificador
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {allProducts.map((product) => (
          <div
            key={product.id}
            className="bg-card border border-border rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-foreground">{product.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {product.slug} · {cs}{Number(product.basePrice).toFixed(2)}
                </p>
                {product.description && (
                  <p className="text-xs text-muted-foreground mt-1">{product.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <PrepTimeButton productId={product.id} />
                <button
                  onClick={() =>
                    setProductForm({
                      id: product.id,
                      categoryId: product.categoryId,
                      name: product.name,
                      description: product.description ?? "",
                      basePrice: Number(product.basePrice),
                      imageUrl: product.imageUrl ?? "",
                      displayOrder: product.displayOrder,
                    })
                  }
                  className="p-1.5 rounded-lg hover:bg-accent"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => void disableProduct(product.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10"
                  title="Desactivar"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Grupos de modificadores asignados
              </p>

              {product.modifierGroups.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin grupos asignados.</p>
              ) : (
                <div className="space-y-1">
                  {product.modifierGroups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between px-3 py-2 rounded-xl border border-border/60 bg-background/50"
                    >
                      <span className="text-sm text-foreground">
                        {group.name} ({group.minSelections}-{group.maxSelections})
                      </span>
                      <button
                        onClick={() =>
                          void removeModifierGroupFromProduct(product.id, group.id)
                        }
                        className="p-1 rounded-lg hover:bg-destructive/10"
                        title="Quitar grupo"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <select
                  value={assignGroupByProduct[product.id] ?? ""}
                  onChange={(e) =>
                    setAssignGroupByProduct((prev) => ({
                      ...prev,
                      [product.id]: e.target.value,
                    }))
                  }
                  className="px-3 py-2 rounded-xl border border-border bg-background text-sm md:col-span-3"
                >
                  <option value="">Seleccionar grupo...</option>
                  {modifierGroups
                    .filter((g) => !product.modifierGroups.some((pg) => pg.id === g.id))
                    .map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => void assignModifierGroup(product.id)}
                  className="px-3 py-2 rounded-full bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-widest"
                >
                  Asignar grupo
                </button>
              </div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Variantes
              </p>
              {product.variants.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin variantes.</p>
              ) : (
                <div className="space-y-1">
                  {product.variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between px-3 py-2 rounded-xl border border-border/60 bg-background/50"
                    >
                      <span className="text-sm text-foreground">
                        {variant.name} · {cs}{Number(variant.price).toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => void editVariant(variant)}
                          className="p-1 rounded-lg hover:bg-accent"
                        >
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => void disableVariant(variant.id)}
                          className="p-1 rounded-lg hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <input
                  value={variantDraftByProduct[product.id]?.name ?? ""}
                  onChange={(e) =>
                    setVariantDraftByProduct((prev) => ({
                      ...prev,
                      [product.id]: {
                        name: e.target.value,
                        price: prev[product.id]?.price ?? 0,
                        displayOrder: prev[product.id]?.displayOrder ?? 0,
                      },
                    }))
                  }
                  placeholder="Nombre variante"
                  className="px-3 py-2 rounded-xl border border-border bg-background text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  value={variantDraftByProduct[product.id]?.price ?? 0}
                  onChange={(e) =>
                    setVariantDraftByProduct((prev) => ({
                      ...prev,
                      [product.id]: {
                        name: prev[product.id]?.name ?? "",
                        price: Number(e.target.value || 0),
                        displayOrder: prev[product.id]?.displayOrder ?? 0,
                      },
                    }))
                  }
                  placeholder="Precio"
                  className="px-3 py-2 rounded-xl border border-border bg-background text-sm"
                />
                <input
                  type="number"
                  value={variantDraftByProduct[product.id]?.displayOrder ?? 0}
                  onChange={(e) =>
                    setVariantDraftByProduct((prev) => ({
                      ...prev,
                      [product.id]: {
                        name: prev[product.id]?.name ?? "",
                        price: prev[product.id]?.price ?? 0,
                        displayOrder: Number(e.target.value || 0),
                      },
                    }))
                  }
                  placeholder="Orden"
                  className="px-3 py-2 rounded-xl border border-border bg-background text-sm"
                />
                <button
                  onClick={() => void createVariant(product.id)}
                  className="px-3 py-2 rounded-full bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-widest"
                >
                  Agregar variante
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── PrepTimeButton ──────────────────────────────────── */

function PrepTimeButton({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState<number | "">("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setOpen(true);
    setSaved(false);
    try {
      const token = getAccessToken();
      const res = await apiFetch<{ estimatedMinutes: number } | null>(
        `/catalog/products/${productId}/prep-time`,
        { token },
      );
      if (res && res.estimatedMinutes) {
        setMinutes(res.estimatedMinutes);
      } else {
        setMinutes("");
      }
    } catch {
      setMinutes("");
    }
  };

  const handleSave = async () => {
    if (minutes === "" || minutes <= 0) return;
    setLoading(true);
    try {
      const token = getAccessToken();
      await apiFetch(`/catalog/products/${productId}/prep-time`, {
        token,
        method: "PUT",
        body: JSON.stringify({ estimatedMinutes: Number(minutes) }),
      });
      setSaved(true);
      setTimeout(() => setOpen(false), 600);
    } catch {
      console.error("Failed to save prep time");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => void handleOpen()}
        className="p-1.5 rounded-lg hover:bg-accent"
        title="Tiempo de preparación"
      >
        <Timer className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-muted/60 rounded-xl px-2 py-1">
      <Timer className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <input
        type="number"
        min={1}
        value={minutes}
        onChange={(e) => setMinutes(e.target.value === "" ? "" : Number(e.target.value))}
        placeholder="min"
        className="w-14 bg-transparent text-sm outline-none text-center"
        autoFocus
      />
      <span className="text-[10px] text-muted-foreground">min</span>
      <button
        onClick={() => void handleSave()}
        disabled={loading || minutes === "" || minutes <= 0}
        className="px-1.5 py-0.5 text-[10px] bg-primary text-primary-foreground rounded font-semibold disabled:opacity-50"
      >
        {saved ? "✓" : "OK"}
      </button>
      <button
        onClick={() => setOpen(false)}
        className="px-1 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
      >
        ✕
      </button>
    </div>
  );
}