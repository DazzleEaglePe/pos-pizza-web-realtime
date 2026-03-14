"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { CategoriesSection } from "./categories-section";
import { ProductsSection } from "./products-section";
import { Category, CategoryForm, ProductForm, Variant, VariantDraft } from "./types";

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

  const [variantDraftByProduct, setVariantDraftByProduct] = useState<Record<string, VariantDraft>>({});

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
        <CategoriesSection
          catalog={catalog}
          categoryForm={categoryForm}
          setCategoryForm={setCategoryForm}
          submitCategory={submitCategory}
          disableCategory={disableCategory}
        />
      )}

      {tab === "products" && (
        <ProductsSection
          catalog={catalog}
          allProducts={allProducts}
          productForm={productForm}
          setProductForm={setProductForm}
          submitProduct={submitProduct}
          disableProduct={disableProduct}
          variantDraftByProduct={variantDraftByProduct}
          setVariantDraftByProduct={setVariantDraftByProduct}
          createVariant={createVariant}
          editVariant={editVariant}
          disableVariant={disableVariant}
        />
      )}
    </div>
  );
}
