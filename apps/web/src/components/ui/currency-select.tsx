"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { LATAM_CURRENCIES, getCurrencySymbol, findCountryByCurrency } from "@/lib/latam-data";
import { CountryFlag } from "@/components/ui/country-flag";
import { cn } from "@/lib/utils";

type Props = {
  value: string; // ISO currency code, e.g. "PEN"
  onChange: (code: string) => void;
  className?: string;
};

export function CurrencySelect({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const country = findCountryByCurrency(value);
  const symbol = getCurrencySymbol(value);
  const selected = LATAM_CURRENCIES.find((c) => c.code === value.toUpperCase());

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-background border border-border rounded-sm text-sm text-foreground hover:bg-accent transition"
      >
        {country && <CountryFlag code={country.code} emoji={country.flag} size={20} />}
        <span className="flex-1 text-left font-medium">
          {value.toUpperCase()}
          {selected && (
            <span className="text-muted-foreground font-normal ml-1.5">
              — {selected.name} ({symbol})
            </span>
          )}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-full max-h-64 overflow-y-auto rounded-sm border border-border bg-card shadow-lg">
          {LATAM_CURRENCIES.map((cur) => {
            const curCountry = findCountryByCurrency(cur.code);
            const isActive = cur.code === value.toUpperCase();
            return (
              <button
                key={cur.code}
                type="button"
                onClick={() => {
                  onChange(cur.code);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-accent",
                  isActive && "bg-primary/10 text-primary",
                )}
              >
                {curCountry ? <CountryFlag code={curCountry.code} emoji={curCountry.flag} size={20} /> : <span className="text-lg leading-none">🌐</span>}
                <div className="flex-1 min-w-0">
                  <span className="font-semibold">{cur.code}</span>
                  <span className="text-muted-foreground ml-1.5">— {cur.name}</span>
                </div>
                <span className="text-xs font-bold text-muted-foreground shrink-0">{cur.symbol}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
