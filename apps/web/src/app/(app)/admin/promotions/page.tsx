"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Gift,
  Star,
  Loader2,
} from "lucide-react";

type PromotionItem = {
  id: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  isRequired: boolean;
  product?: { id: string; name: string; imageUrl?: string | null };
  variant?: { id: string; name: string } | null;
};

type Promotion = {
  id: string;
  name: string;
  description?: string | null;
  promoPrice: number;
  originalPrice?: number | null;
  imageUrl?: string | null;
  isActive: boolean;
  displayOrder: number;
  startDate?: string | null;
  endDate?: string | null;
  items: PromotionItem[];
};

const EMPTY_FORM = {
  name: "",
  description: "",
  promoPrice: "",
  originalPrice: "",
  imageUrl: "",
  isActive: true,
  displayOrder: "0",
};

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Promotion[]>("/promotions/all");
      setPromotions(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(promo: Promotion) {
    setEditingId(promo.id);
    setForm({
      name: promo.name,
      description: promo.description ?? "",
      promoPrice: String(promo.promoPrice),
      originalPrice: promo.originalPrice ? String(promo.originalPrice) : "",
      imageUrl: promo.imageUrl ?? "",
      isActive: promo.isActive,
      displayOrder: String(promo.displayOrder),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        promoPrice: parseFloat(form.promoPrice),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
        imageUrl: form.imageUrl.trim() || null,
        isActive: form.isActive,
        displayOrder: parseInt(form.displayOrder) || 0,
      };
      if (editingId) {
        await apiFetch(`/promotions/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/promotions", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setDialogOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string) {
    await apiFetch(`/promotions/${id}/toggle`, { method: "PATCH" });
    await load();
  }

  async function handleDelete(id: string) {
    await apiFetch(`/promotions/${id}`, { method: "DELETE" });
    setDeleteId(null);
    await load();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <section className="rounded-[24px] border border-border bg-card px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              <Gift className="h-3.5 w-3.5" />
              Centro de promociones
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Gift className="w-6 h-6 text-primary" />
              Combos & Promociones
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona combos, vigencias y precios promocionales visibles en POS.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Nuevo combo
          </Button>
        </div>
      </section>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : promotions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-sm bg-muted/60 flex items-center justify-center mb-4">
            <Gift className="w-6 h-6 text-muted-foreground/60" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            No hay combos creados aún
          </p>
          <Button variant="outline" className="mt-4" onClick={openCreate}>
            Crear primer combo
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {promotions.map((promo) => (
            <Card key={promo.id} className="overflow-hidden">
              <CardContent className="p-4 flex items-start gap-4">
                {/* Image */}
                <div className="w-16 h-16 rounded-sm overflow-hidden bg-muted/40 shrink-0">
                  <img
                    src={
                      promo.imageUrl ||
                      "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=200&h=200&fit=crop"
                    }
                    alt={promo.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-foreground">{promo.name}</h3>
                    <Badge
                      variant={promo.isActive ? "default" : "outline"}
                      className="text-[10px]"
                    >
                      {promo.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>

                  {promo.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {promo.description}
                    </p>
                  )}

                  {/* Items pills */}
                  {promo.items.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {promo.items.map((pi) => (
                        <span
                          key={pi.id}
                          className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted/60 rounded-full px-2 py-0.5"
                        >
                          {pi.quantity > 1 && (
                            <strong className="text-primary">{pi.quantity}×</strong>
                          )}
                          {pi.product?.name}
                          {pi.variant ? ` (${pi.variant.name})` : ""}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-center gap-2 mt-2">
                    {promo.originalPrice && (
                      <span className="text-xs line-through text-muted-foreground/60">
                        S/{Number(promo.originalPrice).toFixed(2)}
                      </span>
                    )}
                    <span className="text-base font-bold text-primary">
                      S/{Number(promo.promoPrice).toFixed(2)}
                    </span>
                    {promo.originalPrice && promo.originalPrice > promo.promoPrice && (
                      <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">
                        -{Math.round(((promo.originalPrice - promo.promoPrice) / promo.originalPrice) * 100)}%
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title={promo.isActive ? "Desactivar" : "Activar"}
                    onClick={() => handleToggle(promo.id)}
                  >
                    {promo.isActive ? (
                      <ToggleRight className="w-4 h-4 text-primary" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(promo)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(promo.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar combo" : "Nuevo combo"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej. Combo Familiar"
                className="w-full h-10 rounded-sm border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Breve descripción del combo"
                className="w-full h-10 rounded-sm border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Precio combo (S/) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.10"
                  value={form.promoPrice}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, promoPrice: e.target.value }))
                  }
                  placeholder="25.00"
                  className="w-full h-10 rounded-sm border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Precio original (S/)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.10"
                  value={form.originalPrice}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, originalPrice: e.target.value }))
                  }
                  placeholder="35.00"
                  className="w-full h-10 rounded-sm border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                URL de imagen
              </label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, imageUrl: e.target.value }))
                }
                placeholder="https://..."
                className="w-full h-10 rounded-sm border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Orden de display
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.displayOrder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, displayOrder: e.target.value }))
                  }
                  className="w-full h-10 rounded-sm border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex flex-col justify-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, isActive: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">Activo</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.promoPrice}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : editingId ? (
                "Guardar cambios"
              ) : (
                "Crear combo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar combo?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta acción no se puede deshacer. El combo será eliminado
            permanentemente.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
