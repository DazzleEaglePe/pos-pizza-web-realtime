"use client";

import { useCallback, useEffect, useState } from "react";
import { Settings, Save } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useConfig } from "@/hooks/useConfig";

type BusinessConfig = {
  id: string;
  companyName: string;
  ruc: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  taxRateDefault: number;
  currency: string;
  timezone: string;
  ticketHeader: string | null;
  ticketFooter: string | null;
  trackingBaseUrl: string | null;
  trackingExpiryHours: number;
  logoUrl: string | null;
};

type BusinessConfigForm = Omit<
  BusinessConfig,
  | "ruc"
  | "address"
  | "phone"
  | "email"
  | "ticketHeader"
  | "ticketFooter"
  | "trackingBaseUrl"
  | "logoUrl"
> & {
  ruc: string;
  address: string;
  phone: string;
  email: string;
  ticketHeader: string;
  ticketFooter: string;
  trackingBaseUrl: string;
  logoUrl: string;
};

export default function AdminSettingsPage() {
  const setTaxRate = useConfig((s) => s.setTaxRate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<BusinessConfigForm>({
    id: "",
    companyName: "POS Pizza",
    ruc: "",
    address: "",
    phone: "",
    email: "",
    taxRateDefault: 18,
    currency: "PEN",
    timezone: "America/Lima",
    ticketHeader: "",
    ticketFooter: "",
    trackingBaseUrl: "",
    trackingExpiryHours: 2,
    logoUrl: "",
  });

  const fetchConfig = useCallback(async () => {
    try {
      const token = getAccessToken();
      const data = await apiFetch<BusinessConfig>("/config/full", { token });
      setForm({
        ...data,
        ruc: data.ruc ?? "",
        address: data.address ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        ticketHeader: data.ticketHeader ?? "",
        ticketFooter: data.ticketFooter ?? "",
        trackingBaseUrl: data.trackingBaseUrl ?? "",
        logoUrl: data.logoUrl ?? "",
      });
      setTaxRate(Number(data.taxRateDefault || 18));
      setError(null);
    } catch (err) {
      console.error("Failed to fetch business config", err);
      setError("No se pudo cargar la configuración.");
    } finally {
      setLoading(false);
    }
  }, [setTaxRate]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const onSave = async () => {
    setSaving(true);
    try {
      const token = getAccessToken();
      const payload = {
        companyName: form.companyName,
        ruc: form.ruc || null,
        address: form.address || null,
        phone: form.phone || null,
        email: form.email || null,
        taxRateDefault: Number(form.taxRateDefault || 18),
        currency: form.currency,
        timezone: form.timezone,
        ticketHeader: form.ticketHeader || null,
        ticketFooter: form.ticketFooter || null,
        trackingBaseUrl: form.trackingBaseUrl || null,
        trackingExpiryHours: Number(form.trackingExpiryHours || 2),
        logoUrl: form.logoUrl || null,
      };

      const updated = await apiFetch<BusinessConfig>("/config", {
        method: "PATCH",
        token,
        body: JSON.stringify(payload),
      });

      setForm((prev) => ({
        ...prev,
        ...updated,
        ruc: updated.ruc ?? "",
        address: updated.address ?? "",
        phone: updated.phone ?? "",
        email: updated.email ?? "",
        ticketHeader: updated.ticketHeader ?? "",
        ticketFooter: updated.ticketFooter ?? "",
        trackingBaseUrl: updated.trackingBaseUrl ?? "",
        logoUrl: updated.logoUrl ?? "",
      }));
      setTaxRate(Number(updated.taxRateDefault || 18));
      setError(null);
      alert("Configuración guardada correctamente.");
    } catch (err) {
      console.error("Failed to update business config", err);
      setError("No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-muted-foreground">Cargando configuración...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Configuración del Negocio
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Datos generales, IGV y formato del ticket.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm font-medium">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <h2 className="font-semibold text-foreground">Negocio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nombre" value={form.companyName} onChange={(v) => setForm((s) => ({ ...s, companyName: v }))} />
          <Field label="RUC" value={form.ruc} onChange={(v) => setForm((s) => ({ ...s, ruc: v }))} />
          <Field label="Teléfono" value={form.phone} onChange={(v) => setForm((s) => ({ ...s, phone: v }))} />
          <Field label="Email" value={form.email} onChange={(v) => setForm((s) => ({ ...s, email: v }))} />
          <Field label="Dirección" value={form.address} onChange={(v) => setForm((s) => ({ ...s, address: v }))} className="md:col-span-2" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <h2 className="font-semibold text-foreground">Impuestos y moneda</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field
            label="IGV (%)"
            type="number"
            value={String(form.taxRateDefault)}
            onChange={(v) => setForm((s) => ({ ...s, taxRateDefault: Number(v || 0) }))}
          />
          <Field label="Moneda" value={form.currency} onChange={(v) => setForm((s) => ({ ...s, currency: v.toUpperCase() }))} />
          <Field label="Zona horaria" value={form.timezone} onChange={(v) => setForm((s) => ({ ...s, timezone: v }))} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <h2 className="font-semibold text-foreground">Ticket y tracking</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Cabecera ticket" value={form.ticketHeader} onChange={(v) => setForm((s) => ({ ...s, ticketHeader: v }))} />
          <Field label="Pie ticket" value={form.ticketFooter} onChange={(v) => setForm((s) => ({ ...s, ticketFooter: v }))} />
          <Field label="Tracking base URL" value={form.trackingBaseUrl} onChange={(v) => setForm((s) => ({ ...s, trackingBaseUrl: v }))} />
          <Field
            label="Expiración tracking (horas)"
            type="number"
            value={String(form.trackingExpiryHours)}
            onChange={(v) => setForm((s) => ({ ...s, trackingExpiryHours: Number(v || 0) }))}
          />
          <Field label="Logo URL" value={form.logoUrl} onChange={(v) => setForm((s) => ({ ...s, logoUrl: v }))} className="md:col-span-2" />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm shadow hover:opacity-90 transition disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50"
      />
    </label>
  );
}
