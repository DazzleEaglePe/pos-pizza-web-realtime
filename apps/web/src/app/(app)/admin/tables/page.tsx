"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useTranslation } from "@/i18n";
import { isUnauthorized, handleSessionExpired } from "@/lib/api-error-handler";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import {
  LayoutGrid,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Users,
} from "lucide-react";
import { AdminPageHeader } from "@pos-pizza/ui";

interface Table {
  id: string;
  number: number;
  capacity: number;
  zone: string | null;
  status: string;
  isActive: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-emerald-500/10 text-emerald-600",
  OCCUPIED: "bg-red-500/10 text-red-500",
  RESERVED: "bg-amber-500/10 text-amber-600",
};

export default function TablesAdminPage() {
  const { t } = useTranslation();

  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);

  const fetchTables = useCallback(async () => {
    try {
      const token = getAccessToken();
      const data = await apiFetch<Table[]>("/tables/all", { token });
      setTables(data);
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      console.error("Failed to fetch tables", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTables();
  }, [fetchTables]);

  const handleToggleActive = async (table: Table) => {
    try {
      const token = getAccessToken();
      await apiFetch(`/tables/${table.id}`, {
        token,
        method: "PATCH",
        body: JSON.stringify({ isActive: !table.isActive }),
      });
      await fetchTables();
    } catch (err) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      console.error("Failed to toggle table", err);
    }
  };

  const zones = Array.from(new Set(tables.map((t2) => t2.zone).filter(Boolean))) as string[];

  if (loading) return <PageSkeleton variant="cards" cards={12} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        icon={<LayoutGrid className="w-4 h-4 text-primary" />}
        title={t("tables.title")}
        description={t("tables.subtitle")}
        actions={
          <button
            onClick={() => {
              setEditingTable(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full font-black text-[11px] uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            {t("tables.addTable")}
          </button>
        }
      />

      {/* Summary */}
      <div className="flex gap-3 flex-wrap">
        <div className="bg-card border border-border rounded-2xl px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">{t("tables.totalTables")}:</span>{" "}
          <span className="font-bold">{tables.length}</span>
        </div>
        <div className="bg-card border border-border rounded-2xl px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">{t("tables.activeTables")}:</span>{" "}
          <span className="font-bold text-emerald-600">{tables.filter((t2) => t2.isActive).length}</span>
        </div>
        {zones.length > 0 && (
          <div className="bg-card border border-border rounded-2xl px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">{t("tables.zones")}:</span>{" "}
            <span className="font-bold">{zones.join(", ")}</span>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${!table.isActive ? "opacity-40" : ""}`}
          >
            <div className="text-2xl font-black text-foreground">{table.number}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              {table.capacity}
            </div>
            {table.zone && (
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-medium text-muted-foreground">
                {table.zone}
              </span>
            )}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_COLORS[table.status] || "bg-muted text-muted-foreground"}`}>
              {table.status}
            </span>
            <div className="flex gap-1 mt-1">
              <button
                onClick={() => {
                  setEditingTable(table);
                  setShowForm(true);
                }}
                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title={t("tables.edit")}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleToggleActive(table)}
                className={`p-1.5 rounded-md hover:bg-muted transition-colors ${table.isActive ? "text-muted-foreground hover:text-red-500" : "text-muted-foreground hover:text-emerald-500"}`}
                title={table.isActive ? t("tables.deactivate") : t("tables.activate")}
              >
                {table.isActive ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <TableFormModal
          table={editingTable}
          zones={zones}
          onClose={() => {
            setShowForm(false);
            setEditingTable(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingTable(null);
            void fetchTables();
          }}
        />
      )}
    </div>
  );
}

/* ─── Table Form Modal ─────────────────────────────── */

function TableFormModal({
  table,
  zones,
  onClose,
  onSaved,
}: {
  table: Table | null;
  zones: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const isEditing = !!table;

  const [number, setNumber] = useState(table?.number ?? 1);
  const [capacity, setCapacity] = useState(table?.capacity ?? 4);
  const [zone, setZone] = useState(table?.zone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = getAccessToken();
      if (isEditing) {
        await apiFetch(`/tables/${table.id}`, {
          token,
          method: "PATCH",
          body: JSON.stringify({ number, capacity, zone: zone || null }),
        });
      } else {
        await apiFetch("/tables", {
          token,
          method: "POST",
          body: JSON.stringify({ number, capacity, zone: zone || undefined }),
        });
      }
      onSaved();
    } catch (err: any) {
      if (isUnauthorized(err)) { handleSessionExpired(); return; }
      setError(err?.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-black mb-4">
          {isEditing ? t("tables.editTable") : t("tables.addTable")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">{t("tables.number")}</label>
            <input
              type="number"
              min={1}
              value={number}
              onChange={(e) => setNumber(parseInt(e.target.value) || 1)}
              required
              className="w-full mt-1 px-3 py-2.5 bg-muted/60 border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">{t("tables.capacity")}</label>
            <input
              type="number"
              min={1}
              max={20}
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value) || 4)}
              required
              className="w-full mt-1 px-3 py-2.5 bg-muted/60 border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">{t("tables.zone")}</label>
            <input
              type="text"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder={t("tables.zonePlaceholder")}
              list="zone-suggestions"
              className="w-full mt-1 px-3 py-2.5 bg-muted/60 border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary/50"
            />
            {zones.length > 0 && (
              <datalist id="zone-suggestions">
                {zones.map((z) => (
                  <option key={z} value={z} />
                ))}
              </datalist>
            )}
          </div>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
              {t("tables.cancel")}
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? "..." : isEditing ? t("tables.save") : t("tables.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
