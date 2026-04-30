const STATUS_MAP: Record<
  string,
  { cls: string; label: string }
> = {
  RECEIVED:  { cls: "bg-primary/10 text-primary border-primary/20",            label: "Recibido"   },
  PREPARING: { cls: "bg-amber-500/10 text-amber-700 border-amber-200",          label: "Preparando" },
  IN_OVEN:   { cls: "bg-amber-500/10 text-amber-700 border-amber-200",          label: "En horno"   },
  READY:     { cls: "bg-emerald-500/10 text-emerald-700 border-emerald-200",    label: "Listo"      },
  DELIVERED: { cls: "bg-emerald-500/10 text-emerald-700 border-emerald-200",    label: "Entregado"  },
  CANCELLED: { cls: "bg-red-500/10 text-red-700 border-red-200",               label: "Cancelado"  },
};

interface PosStatusPillProps {
  status: string;
}

/**
 * Unified status pill for order statuses across POS sub-pages.
 * Replaces duplicated StatusPill components in orders-client and history-client.
 */
export function PosStatusPill({ status }: PosStatusPillProps) {
  const entry = STATUS_MAP[status] ?? {
    cls: "bg-muted text-muted-foreground border-border",
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider ${entry.cls}`}
    >
      {entry.label}
    </span>
  );
}
