"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { UtensilsCrossed, Plus, Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type Variant = {
  id: string;
  productId: string;
  name: string;
  price: number;
  displayOrder: number;
  isActive: boolean;
};

type Product = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  imageUrl: string | null;
  hasVariants: boolean;
  isActive: boolean;
  displayOrder: number;
  variants: Variant[];
};

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  products: Product[];
};

type CategoryForm = {
  id: string | null;
  name: string;
  icon: string;
  description: string;
  displayOrder: number;
};

type ProductForm = {
  id: string | null;
  categoryId: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  displayOrder: number;
};

export default function AdminMenuPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"categories" | "products">("categories");
  const [catalog, setCatalog] = useState<Category[]>([]);

  const [categoryForm, setCategoryForm] = useState<CategoryForm>({
    id: null,
    name: "",
    icon: "",
    description: "",
    displayOrder: 0,
  });

  const [productForm, setProductForm] = useState<ProductForm>({
    id: null,
    categoryId: "",
    name: "",
    description: "",
    basePrice: 0,
    imageUrl: "",
    displayOrder: 0,
  });

  const [variantDraftByProduct, setVariantDraftByProduct] = useState<
    Record<string, { name: string; price: number; displayOrder: number }>
  >({});

  const token = getAccessToken();

  const fetchCatalog = useCallback(async () => {
    try {
      const data = await apiFetch<Category[]>("/catalog/admin", { token });
      setCatalog(data);
      if (!productForm.categoryId && data.length > 0) {
        setProductForm((prev) => ({ ...prev, categoryId: data[0].id }));
      }
      setError(null);
    } catch (err) {
      console.error("Failed to fetch catalog admin", err);
      setError("No se pudo cargar el catálogo.");
    } finally {
      setLoading(false);
    }
  }, [productForm.categoryId, token]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const allProducts = useMemo(
    () => catalog.flatMap((category) => category.products),
    [catalog],
  );

  const resetCategoryForm = () => {
    setCategoryForm({ id: null, name: "", icon: "", description: "", displayOrder: 0 });
  };

  const resetProductForm = () => {
    setProductForm({
      id: null,
      categoryId: catalog[0]?.id ?? "",
      name: "",
      description: "",
      basePrice: 0,
      imageUrl: "",
      displayOrder: 0,
    });
  };

  const submitCategory = async () => {
    try {
      if (!categoryForm.name.trim()) return;
      const payload = {
        name: categoryForm.name.trim(),
        icon: categoryForm.icon.trim() || null,
        description: categoryForm.description.trim() || null,
        displayOrder: Number(categoryForm.displayOrder || 0),
      };

      if (categoryForm.id) {
        await apiFetch(`/catalog/categories/${categoryForm.id}`, {
          method: "PATCH",
          token,
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/catalog/categories", {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        });
      }

      resetCategoryForm();
      await fetchCatalog();
    } catch (err) {
      console.error("Failed to save category", err);
      setError("No se pudo guardar la categoría.");
    }
  };

  const disableCategory = async (id: string) => {
    if (!confirm("¿Desactivar esta categoría?")) return;
    await apiFetch(`/catalog/categories/${id}`, { method: "DELETE", token });
    await fetchCatalog();
  };

  const submitProduct = async () => {
    try {
      if (!productForm.name.trim() || !productForm.categoryId) return;
      const payload = {
        categoryId: productForm.categoryId,
        name: productForm.name.trim(),
        description: productForm.description.trim() || null,
        basePrice: Number(productForm.basePrice || 0),
        imageUrl: productForm.imageUrl.trim() || null,
        displayOrder: Number(productForm.displayOrder || 0),
      };

      if (productForm.id) {
        await apiFetch(`/catalog/products/${productForm.id}`, {
          method: "PATCH",
          token,
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/catalog/products", {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        });
      }

      resetProductForm();
      await fetchCatalog();
    } catch (err) {
      console.error("Failed to save product", err);
      setError("No se pudo guardar el producto.");
    }
  };

  const disableProduct = async (id: string) => {
    if (!confirm("¿Desactivar este producto?")) return;
    await apiFetch(`/catalog/products/${id}`, { method: "DELETE", token });
    await fetchCatalog();
  };

  const createVariant = async (productId: string) => {
    const draft = variantDraftByProduct[productId] || {
      name: "",
      price: 0,
      displayOrder: 0,
    };
    if (!draft.name.trim()) return;

    await apiFetch(`/catalog/products/${productId}/variants`, {
      method: "POST",
      token,
      body: JSON.stringify({
        name: draft.name.trim(),
        price: Number(draft.price || 0),
        displayOrder: Number(draft.displayOrder || 0),
      }),
    });

    setVariantDraftByProduct((prev) => ({
      ...prev,
      [productId]: { name: "", price: 0, displayOrder: 0 },
    }));
    await fetchCatalog();
  };

  const editVariant = async (variant: Variant) => {
    const name = prompt("Nombre de variante", variant.name);
    if (!name) return;
    const priceRaw = prompt("Precio", String(variant.price));
    if (!priceRaw) return;

    await apiFetch(`/catalog/variants/${variant.id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ name: name.trim(), price: Number(priceRaw) }),
    });
    await fetchCatalog();
  };

  const disableVariant = async (variantId: string) => {
    if (!confirm("¿Desactivar esta variante?")) return;
    await apiFetch(`/catalog/variants/${variantId}`, { method: "DELETE", token });
    await fetchCatalog();
  };

  if (loading) {
    return <div className="p-6 text-muted-foreground">Cargando catálogo...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UtensilsCrossed className="w-6 h-6 text-primary" />
          Gestión de Menú
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Administra categorías, productos y variantes.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm font-medium">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("categories")}
          className={`px-4 py-2 rounded-sm text-sm font-semibold transition ${
            tab === "categories"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-foreground"
          }`}
        >
          Categorías
        </button>
        <button
          type="button"
          onClick={() => setTab("products")}
          className={`px-4 py-2 rounded-sm text-sm font-semibold transition ${
            tab === "products"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-foreground"
          }`}
        >
          Productos
        </button>
      </div>

      {tab === "categories" && (
        <>
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-foreground">{categoryForm.id ? "Editar categoría" : "Nueva categoría"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="Nombre"
                className="px-3 py-2.5 rounded-sm border border-border bg-background text-sm"
              />
              <input
                value={categoryForm.icon}
                onChange={(e) => setCategoryForm((s) => ({ ...s, icon: e.target.value }))}
                placeholder="Icon"
                className="px-3 py-2.5 rounded-sm border border-border bg-background text-sm"
              />
              <input
                type="number"
                value={categoryForm.displayOrder}
                onChange={(e) =>
                  setCategoryForm((s) => ({ ...s, displayOrder: Number(e.target.value || 0) }))
                }
                placeholder="Orden"
                className="px-3 py-2.5 rounded-sm border border-border bg-background text-sm"
              />
              <button
                type="button"
                onClick={submitCategory}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-sm text-sm font-semibold"
              >
                <span className="inline-flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  {categoryForm.id ? "Actualizar" : "Crear"}
                </span>
              </button>
              <input
                value={categoryForm.description}
                onChange={(e) => setCategoryForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="Descripción"
                className="px-3 py-2.5 rounded-sm border border-border bg-background text-sm md:col-span-4"
              />
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Categoría</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Slug</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Orden</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {catalog.map((category) => (
                    <tr key={category.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium text-foreground">{category.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{category.slug}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{category.displayOrder}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${category.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {category.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() =>
                              setCategoryForm({
                                id: category.id,
                                name: category.name,
                                icon: category.icon ?? "",
                                description: category.description ?? "",
                                displayOrder: category.displayOrder,
                              })
                            }
                            className="p-1.5 rounded-sm hover:bg-accent"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => disableCategory(category.id)}
                            className="p-1.5 rounded-sm hover:bg-destructive/10"
                            title="Desactivar"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "products" && (
        <>
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-foreground">{productForm.id ? "Editar producto" : "Nuevo producto"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={productForm.categoryId}
                onChange={(e) => setProductForm((s) => ({ ...s, categoryId: e.target.value }))}
                className="px-3 py-2.5 rounded-sm border border-border bg-background text-sm"
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
                className="px-3 py-2.5 rounded-sm border border-border bg-background text-sm"
              />
              <input
                type="number"
                step="0.01"
                value={productForm.basePrice}
                onChange={(e) =>
                  setProductForm((s) => ({ ...s, basePrice: Number(e.target.value || 0) }))
                }
                placeholder="Precio base"
                className="px-3 py-2.5 rounded-sm border border-border bg-background text-sm"
              />
              <button
                type="button"
                onClick={submitProduct}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-sm text-sm font-semibold"
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
                className="px-3 py-2.5 rounded-sm border border-border bg-background text-sm md:col-span-2"
              />
              <input
                value={productForm.imageUrl}
                onChange={(e) => setProductForm((s) => ({ ...s, imageUrl: e.target.value }))}
                placeholder="URL de imagen"
                className="px-3 py-2.5 rounded-sm border border-border bg-background text-sm md:col-span-2"
              />
            </div>
          </div>

          <div className="space-y-3">
            {allProducts.map((product) => (
              <div key={product.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">{product.slug} · S/{Number(product.basePrice).toFixed(2)}</p>
                    {product.description && (
                      <p className="text-xs text-muted-foreground mt-1">{product.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
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
                      className="p-1.5 rounded-sm hover:bg-accent"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => disableProduct(product.id)}
                      className="p-1.5 rounded-sm hover:bg-destructive/10"
                      title="Desactivar"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Variantes</p>
                  {product.variants.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin variantes.</p>
                  ) : (
                    <div className="space-y-1">
                      {product.variants.map((variant) => (
                        <div key={variant.id} className="flex items-center justify-between px-3 py-2 rounded-sm border border-border/60 bg-background/50">
                          <span className="text-sm text-foreground">
                            {variant.name} · S/{Number(variant.price).toFixed(2)}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => editVariant(variant)}
                              className="p-1 rounded-sm hover:bg-accent"
                            >
                              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => disableVariant(variant.id)}
                              className="p-1 rounded-sm hover:bg-destructive/10"
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
                      className="px-3 py-2 rounded-sm border border-border bg-background text-sm"
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
                      className="px-3 py-2 rounded-sm border border-border bg-background text-sm"
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
                      className="px-3 py-2 rounded-sm border border-border bg-background text-sm"
                    />
                    <button
                      onClick={() => createVariant(product.id)}
                      className="px-3 py-2 rounded-sm bg-primary text-primary-foreground text-sm font-semibold"
                    >
                      Agregar variante
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
