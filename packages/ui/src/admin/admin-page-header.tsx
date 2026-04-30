import type { ReactNode } from "react";

interface AdminPageHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
  /** Right-aligned slot for date pickers, filters, CTA buttons, etc. */
  actions?: ReactNode;
}

/**
 * Standard page header for all admin pages.
 *
 * Icon badge: w-9 h-9 rounded-xl bg-primary/10 border border-primary/15
 * Title: text-2xl font-black tracking-tight
 */
export function AdminPageHeader({
  icon,
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-foreground truncate">
            {title}
          </h1>
          {description && (
            <p className="text-[13px] font-medium text-muted-foreground mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
