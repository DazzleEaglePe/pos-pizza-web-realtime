"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { AlertTriangle, PackagePlus } from "lucide-react";
import { AdminPageHeader } from "@pos-pizza/ui";
import Link from "next/link";

interface AlertItem {
  id: string;
  name: string;
  sku: string | null;
  unitOfMeasure: string;
  currentStock: number;
  minStockAlert: number;
  supplier: string | null;
  shortage: number;
  urgency: "critical" | "warning";
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadAlerts = async () => {
      const token = getAccessToken();
      const data = await apiFetch<AlertItem[]>('/inventory/alerts', { token });
      if (cancelled) return;
      setAlerts(data);
      setLoading(false);
    };

    void loadAlerts();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader
        icon={<AlertTriangle className="w-4 h-4 text-primary" />}
        title="Alertas de Stock Bajo"
        description="Monitorea insumos por debajo del mínimo para actuar a tiempo."
      />

      {loading ? (
        <PageSkeleton variant="cards" cards={4} showHero={false} />
      ) : alerts.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-2">
          <div className="text-4xl">✅</div>
          <h3 className="text-lg font-bold text-foreground">
            Todo en orden
          </h3>
          <p className="text-sm text-muted-foreground">
            Todos los insumos están por encima de su stock mínimo.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-card rounded-2xl border p-4 flex items-center justify-between ${
                alert.urgency === "critical"
                  ? "border-destructive/50"
                  : "border-yellow-500/50"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    alert.urgency === "critical"
                      ? "bg-destructive/10"
                      : "bg-yellow-500/10"
                  }`}
                >
                  <AlertTriangle
                    className={`w-5 h-5 ${
                      alert.urgency === "critical"
                        ? "text-destructive"
                        : "text-yellow-500"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{alert.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {alert.sku && `${alert.sku} · `}
                    {alert.supplier || "Sin proveedor"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    Stock Actual
                  </div>
                  <div
                    className={`font-bold ${
                      alert.urgency === "critical"
                        ? "text-destructive"
                        : "text-yellow-500"
                    }`}
                  >
                    {alert.currentStock.toLocaleString()} {alert.unitOfMeasure}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    Mínimo
                  </div>
                  <div className="font-medium text-foreground">
                    {alert.minStockAlert.toLocaleString()} {alert.unitOfMeasure}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Faltante</div>
                  <div className="font-bold text-destructive">
                    {alert.shortage.toLocaleString()} {alert.unitOfMeasure}
                  </div>
                </div>
                <Link
                  href="/admin/inventory/restock"
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-full text-[11px] font-black uppercase tracking-widest shadow hover:opacity-90 transition"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  Reponer
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
