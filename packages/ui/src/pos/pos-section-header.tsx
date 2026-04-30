type SectionVariant = "default" | "amber" | "emerald";

const VARIANT_MAP: Record<SectionVariant, string> = {
  default:  "bg-primary/10 text-primary border border-primary/20",
  amber:    "bg-amber-500/10 text-amber-700 border border-amber-200",
  emerald:  "bg-emerald-500/10 text-emerald-700 border border-emerald-200",
};

interface PosSectionHeaderProps {
  label: string;
  count: number;
  variant?: SectionVariant;
}

/**
 * Kanban column header used in the /pos/orders three-column layout.
 */
export function PosSectionHeader({
  label,
  count,
  variant = "default",
}: PosSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </h2>
      <span
        className={`inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full text-xs font-black ${VARIANT_MAP[variant]}`}
      >
        {count}
      </span>
    </div>
  );
}
