"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { LATAM_COUNTRIES, type LatamCountry } from "@/lib/latam-data";
import { CountryFlag } from "@/components/ui/country-flag";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

/** Detect which country matches the phone's prefix */
function detectCountry(phone: string): LatamCountry {
  const cleaned = phone.replace(/[\s-]/g, "");
  // Sort by phone code length descending to match longest prefix first
  const sorted = [...LATAM_COUNTRIES].sort(
    (a, b) => b.phoneCode.replace("-", "").length - a.phoneCode.replace("-", "").length,
  );
  for (const c of sorted) {
    const code = c.phoneCode.replace("-", "");
    if (cleaned.startsWith(code)) return c;
  }
  return LATAM_COUNTRIES[0]; // Default: Perú
}

/** Extract the local number (without country code prefix) */
function extractLocalNumber(phone: string, country: LatamCountry): string {
  const cleaned = phone.replace(/[\s-]/g, "");
  const code = country.phoneCode.replace("-", "");
  if (cleaned.startsWith(code)) return cleaned.slice(code.length);
  return cleaned.startsWith("+") ? "" : cleaned;
}

export function PhoneInput({ value, onChange, placeholder = "Teléfono de contacto", className }: Props) {
  const [country, setCountry] = useState<LatamCountry>(() => detectCountry(value));
  const [localNumber, setLocalNumber] = useState(() => extractLocalNumber(value, detectCountry(value)));
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleCountrySelect = useCallback(
    (c: LatamCountry) => {
      setCountry(c);
      setOpen(false);
      const code = c.phoneCode.replace("-", "");
      onChange(localNumber ? `${code}${localNumber}` : "");
    },
    [localNumber, onChange],
  );

  const handleNumberChange = useCallback(
    (num: string) => {
      // Allow only digits
      const digits = num.replace(/\D/g, "");
      setLocalNumber(digits);
      const code = country.phoneCode.replace("-", "");
      onChange(digits ? `${code}${digits}` : "");
    },
    [country, onChange],
  );

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="flex">
        {/* Country code button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-background border border-border border-r-0 rounded-l-sm text-sm text-foreground hover:bg-accent transition shrink-0"
        >
          <CountryFlag code={country.code} emoji={country.flag} size={20} />
          <span className="text-xs font-semibold text-muted-foreground">{country.phoneCode}</span>
          <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>

        {/* Number input */}
        <input
          type="tel"
          value={localNumber}
          onChange={(e) => handleNumberChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-0 px-3 py-2.5 bg-background border border-border rounded-r-sm text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-72 max-h-64 overflow-y-auto rounded-sm border border-border bg-card shadow-lg">
          {LATAM_COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => handleCountrySelect(c)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-accent",
                c.code === country.code && "bg-primary/10 text-primary",
              )}
            >
              <CountryFlag code={c.code} emoji={c.flag} size={20} />
              <span className="flex-1 font-medium text-foreground">{c.name}</span>
              <span className="text-xs text-muted-foreground font-semibold">{c.phoneCode}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
