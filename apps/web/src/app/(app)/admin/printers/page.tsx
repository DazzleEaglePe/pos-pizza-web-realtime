"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { isUnauthorized, handleSessionExpired } from "@/lib/api-error-handler";
import { PageSkeleton } from "@/components/ui/page-skeleton";
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
  Printer,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Star,
  Wifi,
  Usb,
  Loader2,
} from "lucide-react";
import { AdminPageHeader } from "@pos-pizza/ui";
import { posAlert } from "@/lib/sweetalert";

/* ─── Types ───────────────────────────────────────────── */

interface PrinterConfig {
  id: string;
  name: string;
  location: string;
  connectionType: string;
  ipAddress: string | null;
  port: number | null;
  paperWidth: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

const LOCATION_LABELS: Record<string, { label: string; color: string }> = {
  CASHIER: { label: "Caja", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  KITCHEN: { label: "Cocina", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
};

const CONNECTION_LABELS: Record<string, { label: string; icon: typeof Wifi }> = {
  USB: { label: "USB", icon: Usb },
  NETWORK: { label: "Red", icon: Wifi },
};

const EMPTY_FORM = {
  name: "",
  location: "CASHIER",
  connectionType: "USB",
  ipAddress: "",
  port: "",
  paperWidth: "80",
  isActive: true,
};

/* ─── Component ───────────────────────────────────────── */

export default function AdminPrintersPage() {
  const [printers, setPrinters] = useState<PrinterConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = getAccessToken();
      const data = await apiFetch<PrinterConfig[]>("/printers", { token });
      setPrinters(Array.isArray(data) ? data : []);
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      console.error("Failed to load printers", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* ─── Dialog helpers ──────────────────────────────── */

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(p: PrinterConfig) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      location: p.location,
      connectionType: p.connectionType,
      ipAddress: p.ipAddress ?? "",
      port: p.port ? String(p.port) : "",
      paperWidth: String(p.paperWidth),
      isActive: p.isActive,
    });
    setDialogOpen(true);
  }

  /* ─── CRUD handlers ──────────────────────────────── */

  async function handleSave() {
    setSaving(true);
    try {
      const token = getAccessToken();
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        location: form.location,
        connectionType: form.connectionType,
        ipAddress: form.connectionType === "NETWORK" ? (form.ipAddress.trim() || null) : null,
        port: form.connectionType === "NETWORK" && form.port ? parseInt(form.port, 10) : null,
        paperWidth: parseInt(form.paperWidth, 10),
        isActive: form.isActive,
      };
      if (editingId) {
        await apiFetch(`/printers/${editingId}`, { token, method: "PATCH", body: JSON.stringify(body) });
      } else {
        await apiFetch("/printers", { token, method: "POST", body: JSON.stringify(body) });
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      posAlert.fire({ icon: "error", title: "Error", text: "No se pudo guardar la impresora." });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(p: PrinterConfig) {
    try {
      const token = getAccessToken();
      await apiFetch(`/printers/${p.id}`, {
        token,
        method: "PATCH",
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      await load();
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      console.error("Failed to toggle printer", err);
    }
  }

  async function handleSetDefault(p: PrinterConfig) {
    try {
      const token = getAccessToken();
      await apiFetch(`/printers/${p.id}/default`, { token, method: "PATCH" });
      await load();
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      console.error("Failed to set default", err);
    }
  }

  async function handleDelete(id: string) {
    const result = await posAlert.fire({
      icon: "warning",
      title: "¿Eliminar impresora?",
      text: "Esta acción no se puede deshacer.",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    try {
      const token = getAccessToken();
      await apiFetch(`/printers/${id}`, { token, method: "DELETE" });
      await load();
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      posAlert.fire({ icon: "error", title: "Error", text: "No se pudo eliminar." });
    }
  }

  /* ─── Form validation ────────────────────────────── */

  const isFormValid =
    form.name.trim().length > 0 &&
    (form.connectionType !== "NETWORK" || form.ipAddress.trim().length > 0);

  /* ─── Render ──────────────────────────────────────── */

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Hero */}
      <AdminPageHeader
        icon={<Printer className="w-4 h-4 text-primary" />}
        title="Impresoras Térmicas"
        description="Configura las impresoras térmicas de caja y cocina conectadas al sistema."
        actions={
          <Button onClick={openCreate} className="gap-2 shrink-0 rounded-full font-black text-[11px] uppercase tracking-widest">
            <Plus className="w-4 h-4" />
            Nueva impresora
          </Button>
        }
      />

      {/* List */}
      {loading ? (
        <PageSkeleton variant="cards" cards={3} showHero={false} />
      ) : printers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
            <Printer className="w-6 h-6 text-muted-foreground/60" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            No hay impresoras configuradas
          </p>
          <Button variant="outline" className="mt-4" onClick={openCreate}>
            Configurar primera impresora
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {printers.map((p) => {
            const loc = LOCATION_LABELS[p.location] ?? { label: p.location, color: "bg-muted text-muted-foreground" };
            const conn = CONNECTION_LABELS[p.connectionType] ?? { label: p.connectionType, icon: Wifi };
            const ConnIcon = conn.icon;
            return (
              <Card key={p.id} className="overflow-hidden">
                <CardContent className="p-4 flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Printer className="w-5 h-5 text-primary" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-foreground">{p.name}</h3>
                      {p.isDefault && (
                        <Badge className="text-[10px] bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                          <Star className="w-3 h-3 mr-0.5" /> Default
                        </Badge>
                      )}
                      <Badge
                        variant={p.isActive ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {p.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] ${loc.color}`}>
                        {loc.label}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <ConnIcon className="w-3 h-3" />
                        {conn.label}
                        {p.connectionType === "NETWORK" && p.ipAddress && (
                          <span className="ml-1 font-mono text-[10px]">
                            {p.ipAddress}{p.port ? `:${p.port}` : ""}
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {p.paperWidth}mm
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!p.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Marcar como default"
                        onClick={() => handleSetDefault(p)}
                      >
                        <Star className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title={p.isActive ? "Desactivar" : "Activar"}
                      onClick={() => handleToggleActive(p)}
                    >
                      {p.isActive ? (
                        <ToggleRight className="w-4 h-4 text-primary" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar impresora" : "Nueva impresora"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div>
              <label className="text-sm font-medium text-foreground">Nombre</label>
              <input
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Ej: Impresora Caja Principal"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium text-foreground">Ubicación</label>
              <select
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              >
                <option value="CASHIER">Caja</option>
                <option value="KITCHEN">Cocina</option>
              </select>
            </div>

            {/* Connection Type */}
            <div>
              <label className="text-sm font-medium text-foreground">Tipo de conexión</label>
              <select
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                value={form.connectionType}
                onChange={(e) =>
                  setForm({ ...form, connectionType: e.target.value, ipAddress: "", port: "" })
                }
              >
                <option value="USB">USB</option>
                <option value="NETWORK">Red (IP)</option>
              </select>
            </div>

            {/* Network fields — conditional */}
            {form.connectionType === "NETWORK" && (
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-foreground">Dirección IP</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                    placeholder="192.168.1.100"
                    value={form.ipAddress}
                    onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Puerto</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                    placeholder="9100"
                    value={form.port}
                    onChange={(e) => setForm({ ...form, port: e.target.value.replace(/\D/g, "") })}
                  />
                </div>
              </div>
            )}

            {/* Paper Width */}
            <div>
              <label className="text-sm font-medium text-foreground">Ancho de papel</label>
              <select
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                value={form.paperWidth}
                onChange={(e) => setForm({ ...form, paperWidth: e.target.value })}
              >
                <option value="80">80mm (estándar)</option>
                <option value="58">58mm (compacto)</option>
              </select>
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="accent-primary w-4 h-4"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              <span className="text-sm text-foreground">Impresora activa</span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !isFormValid}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
