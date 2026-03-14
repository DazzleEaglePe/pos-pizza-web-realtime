import { Dispatch, SetStateAction } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Category, CategoryForm } from "./types";

type CategoriesSectionProps = {
  catalog: Category[];
  categoryForm: CategoryForm;
  setCategoryForm: Dispatch<SetStateAction<CategoryForm>>;
  submitCategory: () => Promise<void>;
  disableCategory: (id: string) => Promise<void>;
};

export function CategoriesSection({
  catalog,
  categoryForm,
  setCategoryForm,
  submitCategory,
  disableCategory,
}: CategoriesSectionProps) {
  return (
    <>
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-foreground">
          {categoryForm.id ? "Editar categoría" : "Nueva categoría"}
        </h2>
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
            onClick={() => void submitCategory()}
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
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  Categoría
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  Slug
                </th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                  Orden
                </th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
                  Estado
                </th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {catalog.map((category) => (
                <tr
                  key={category.id}
                  className="border-b border-border/50 hover:bg-muted/20"
                >
                  <td className="px-4 py-3 font-medium text-foreground">{category.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{category.slug}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {category.displayOrder}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        category.isActive
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
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
                        onClick={() => void disableCategory(category.id)}
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
  );
}