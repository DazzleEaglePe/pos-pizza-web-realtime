import { Dispatch, SetStateAction } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Category, Product, ProductForm, Variant, VariantDraft } from "./types";

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
}: ProductsSectionProps) {
  return (
    <>
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-foreground">
          {productForm.id ? "Editar producto" : "Nuevo producto"}
        </h2>
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
            onClick={() => void submitProduct()}
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
          <div
            key={product.id}
            className="bg-card border border-border rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-foreground">{product.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {product.slug} · S/{Number(product.basePrice).toFixed(2)}
                </p>
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
                  onClick={() => void disableProduct(product.id)}
                  className="p-1.5 rounded-sm hover:bg-destructive/10"
                  title="Desactivar"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
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
                      className="flex items-center justify-between px-3 py-2 rounded-sm border border-border/60 bg-background/50"
                    >
                      <span className="text-sm text-foreground">
                        {variant.name} · S/{Number(variant.price).toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => void editVariant(variant)}
                          className="p-1 rounded-sm hover:bg-accent"
                        >
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => void disableVariant(variant.id)}
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
                  onClick={() => void createVariant(product.id)}
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
  );
}