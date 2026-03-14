"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { CategoriesSection } from "./categories-section";
import { ProductsSection } from "./products-section";
import {
  Category,
  CategoryForm,
  Modifier,
  ModifierDraft,
  ModifierGroup,
  ModifierGroupForm,
  ProductForm,
  Variant,
  VariantDraft,
} from "./types";

function getRequestErrorMessage(err: unknown, fallback: string) {
  if (err instanceof ApiError && err.status === 401) {
    return "Tu sesión expiró o no es válida. Vuelve a iniciar sesión.";
  }
  return fallback;
}

export default function AdminMenuPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"categories" | "products">("categories");
  const [catalog, setCatalog] = useState<Category[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);

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
  const [modifierDraftByGroup, setModifierDraftByGroup] = useState<Record<string, ModifierDraft>>({});
  const [assignGroupByProduct, setAssignGroupByProduct] = useState<Record<string, string>>({});

  const [modifierGroupForm, setModifierGroupForm] = useState<ModifierGroupForm>({
    id: null,
    name: "",
    description: "",
    minSelections: 0,
    maxSelections: 99,
    displayOrder: 0,
  });

  const fetchCatalog = useCallback(async () => {
    try {
      const token = getAccessToken();
      const [catalogData, groupsData] = await Promise.all([
        apiFetch<Category[]>("/catalog/admin", { token }),
        apiFetch<ModifierGroup[]>("/catalog/modifier-groups", { token }),
      ]);
      setCatalog(catalogData);
      setModifierGroups(groupsData);
      if (!productForm.categoryId && catalogData.length > 0) {
        setProductForm((prev) => ({ ...prev, categoryId: catalogData[0].id }));
      }
      setError(null);
    } catch (err) {
      console.error("Failed to fetch catalog admin", err);
      setError(getRequestErrorMessage(err, "No se pudo cargar el catálogo."));
    } finally {
      setLoading(false);
    }
  }, [productForm.categoryId]);

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

  const resetModifierGroupForm = () => {
    setModifierGroupForm({
      id: null,
      name: "",
      description: "",
      minSelections: 0,
      maxSelections: 99,
      displayOrder: 0,
    });
  };

  const submitCategory = async () => {
    try {
      const token = getAccessToken();
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
      setError(getRequestErrorMessage(err, "No se pudo guardar la categoría."));
    }
  };

  const disableCategory = async (id: string) => {
    if (!confirm("¿Desactivar esta categoría?")) return;
    const token = getAccessToken();
    await apiFetch(`/catalog/categories/${id}`, { method: "DELETE", token });
    await fetchCatalog();
  };

  const submitProduct = async () => {
    try {
      const token = getAccessToken();
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
      setError(getRequestErrorMessage(err, "No se pudo guardar el producto."));
    }
  };

  const disableProduct = async (id: string) => {
    if (!confirm("¿Desactivar este producto?")) return;
    const token = getAccessToken();
    await apiFetch(`/catalog/products/${id}`, { method: "DELETE", token });
    await fetchCatalog();
  };

  const createVariant = async (productId: string) => {
    const token = getAccessToken();
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
    const token = getAccessToken();
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
    const token = getAccessToken();
    await apiFetch(`/catalog/variants/${variantId}`, { method: "DELETE", token });
    await fetchCatalog();
  };

  const submitModifierGroup = async () => {
    try {
      const token = getAccessToken();
      if (!modifierGroupForm.name.trim()) return;
      const payload = {
        name: modifierGroupForm.name.trim(),
        description: modifierGroupForm.description.trim() || null,
        minSelections: Number(modifierGroupForm.minSelections || 0),
        maxSelections: Number(modifierGroupForm.maxSelections || 99),
        displayOrder: Number(modifierGroupForm.displayOrder || 0),
      };

      if (modifierGroupForm.id) {
        await apiFetch(`/catalog/modifier-groups/${modifierGroupForm.id}`, {
          method: "PATCH",
          token,
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/catalog/modifier-groups", {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        });
      }

      resetModifierGroupForm();
      await fetchCatalog();
    } catch (err) {
      console.error("Failed to save modifier group", err);
      setError(getRequestErrorMessage(err, "No se pudo guardar el grupo de modificadores."));
    }
  };

  const disableModifierGroup = async (groupId: string) => {
    if (!confirm("¿Desactivar este grupo de modificadores?")) return;
    const token = getAccessToken();
    await apiFetch(`/catalog/modifier-groups/${groupId}`, {
      method: "DELETE",
      token,
    });
    await fetchCatalog();
  };

  const createModifier = async (groupId: string) => {
    const token = getAccessToken();
    const draft = modifierDraftByGroup[groupId] || {
      name: "",
      price: 0,
      displayOrder: 0,
    };
    if (!draft.name.trim()) return;

    await apiFetch(`/catalog/modifier-groups/${groupId}/modifiers`, {
      method: "POST",
      token,
      body: JSON.stringify({
        name: draft.name.trim(),
        price: Number(draft.price || 0),
        displayOrder: Number(draft.displayOrder || 0),
      }),
    });

    setModifierDraftByGroup((prev) => ({
      ...prev,
      [groupId]: { name: "", price: 0, displayOrder: 0 },
    }));
    await fetchCatalog();
  };

  const editModifier = async (modifier: Modifier) => {
    const token = getAccessToken();
    const name = prompt("Nombre del modificador", modifier.name);
    if (!name) return;
    const priceRaw = prompt("Precio", String(modifier.price));
    if (!priceRaw) return;

    await apiFetch(`/catalog/modifiers/${modifier.id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ name: name.trim(), price: Number(priceRaw) }),
    });
    await fetchCatalog();
  };

  const disableModifier = async (modifierId: string) => {
    if (!confirm("¿Desactivar este modificador?")) return;
    const token = getAccessToken();
    await apiFetch(`/catalog/modifiers/${modifierId}`, { method: "DELETE", token });
    await fetchCatalog();
  };

  const assignModifierGroup = async (productId: string) => {
    const token = getAccessToken();
    const modifierGroupId = assignGroupByProduct[productId];
    if (!modifierGroupId) return;

    await apiFetch(`/catalog/products/${productId}/modifier-groups`, {
      method: "POST",
      token,
      body: JSON.stringify({ modifierGroupId }),
    });

    setAssignGroupByProduct((prev) => ({ ...prev, [productId]: "" }));
    await fetchCatalog();
  };

  const removeModifierGroupFromProduct = async (
    productId: string,
    modifierGroupId: string,
  ) => {
    if (!confirm("¿Quitar este grupo del producto?")) return;
    const token = getAccessToken();
    await apiFetch(`/catalog/products/${productId}/modifier-groups/${modifierGroupId}`, {
      method: "DELETE",
      token,
    });
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
        <div className="px-4 py-3 rounded-sm border border-destructive/40 bg-destructive/10 text-destructive text-sm font-medium">
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
          modifierGroups={modifierGroups}
          modifierGroupForm={modifierGroupForm}
          setModifierGroupForm={setModifierGroupForm}
          submitModifierGroup={submitModifierGroup}
          disableModifierGroup={disableModifierGroup}
          modifierDraftByGroup={modifierDraftByGroup}
          setModifierDraftByGroup={setModifierDraftByGroup}
          createModifier={createModifier}
          editModifier={editModifier}
          disableModifier={disableModifier}
          assignGroupByProduct={assignGroupByProduct}
          setAssignGroupByProduct={setAssignGroupByProduct}
          assignModifierGroup={assignModifierGroup}
          removeModifierGroupFromProduct={removeModifierGroupFromProduct}
        />
      )}
    </div>
  );
}
