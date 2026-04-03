"use client";

import { Search, X } from "lucide-react";

interface PosSearchCardProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

/**
 * Unified inline search card used on history and bills pages.
 * Styled: bg-card border border-border rounded-3xl with transparent input.
 */
export function PosSearchCard({
  value,
  onChange,
  placeholder = "Ej: TKT-260312-0012",
  label = "Buscar por ticket",
}: PosSearchCardProps) {
  return (
    <div className="bg-card border border-border rounded-sm p-4 sm:p-5 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-muted/60 flex items-center justify-center shrink-0">
          <Search className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            {label}
          </div>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="mt-1 w-full bg-transparent outline-none text-sm font-bold tracking-wide text-foreground placeholder:text-muted-foreground"
          />
        </div>
        {value.trim() && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="w-10 h-10 rounded-2xl hover:bg-accent/60 transition-colors flex items-center justify-center shrink-0"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
