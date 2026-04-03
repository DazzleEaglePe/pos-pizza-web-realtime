import type { ReactNode } from "react";

interface PosPageHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
  /** Badge/counter row rendered below the description */
  children?: ReactNode;
  cta?: {
    label: string;
    href: string;
    icon?: ReactNode;
  };
}

/**
 * Standard page header used across all POS sub-pages.
 *
 * icon badge: w-10 h-10 rounded-2xl bg-primary/10 border border-primary/15
 * title: text-3xl font-black tracking-tight
 * CTA: h-11 px-5 rounded-full bg-primary font-black text-xs uppercase tracking-widest
 */
export function PosPageHeader({
  icon,
  title,
  description,
  children,
  cta,
}: PosPageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-6 mb-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {title}
          </h1>
        </div>
        {description && (
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            {description}
          </p>
        )}
        {children && <div className="mt-4 flex items-center gap-3">{children}</div>}
      </div>

      {cta && (
        <a
          href={cta.href}
          className="hidden sm:inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:opacity-95 transition-opacity"
        >
          {cta.label}
          {cta.icon}
        </a>
      )}
    </div>
  );
}
