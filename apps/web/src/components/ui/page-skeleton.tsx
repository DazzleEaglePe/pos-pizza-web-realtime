import { Skeleton } from "@/components/ui/skeleton";

type Variant = "table" | "cards" | "form" | "board" | "settings";

type Props = {
  variant?: Variant;
  rows?: number;
  cols?: number;
  cards?: number;
  showHero?: boolean;
  showFilterBar?: boolean;
};

function HeroSkeleton() {
  return (
    <section className="rounded-[24px] border border-border bg-card px-6 py-6">
      <div className="space-y-3">
        <Skeleton className="h-6 w-40 rounded-sm" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
    </section>
  );
}

function FilterBarSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-72 rounded-sm" />
      <Skeleton className="h-10 w-28 rounded-sm" />
    </div>
  );
}

function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-card rounded-sm border border-border overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 rounded-sm" />
        ))}
      </div>
      <div className="divide-y divide-border/50">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-4 py-3.5 flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={`h-4 flex-1 rounded-sm ${c === 0 ? "max-w-40" : ""}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CardsSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-sm border border-border p-4 flex items-center gap-4"
        >
          <Skeleton className="w-14 h-14 rounded-sm shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 rounded-sm" />
            <Skeleton className="h-3 w-1/2 rounded-sm" />
          </div>
          <Skeleton className="h-8 w-20 rounded-sm" />
        </div>
      ))}
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="bg-card rounded-sm border border-border p-6 space-y-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3 w-24 rounded-sm" />
          <Skeleton className="h-10 w-full rounded-sm" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 rounded-sm" />
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, col) => (
        <div key={col} className="space-y-4">
          <Skeleton className="h-6 w-32 rounded-sm" />
          {Array.from({ length: 3 }).map((_, row) => (
            <div
              key={row}
              className="bg-card rounded-sm border border-border p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24 rounded-sm" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full rounded-sm" />
              <Skeleton className="h-3 w-3/4 rounded-sm" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="flex gap-6">
      {/* Lateral nav */}
      <div className="w-56 shrink-0 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-sm" />
        ))}
      </div>
      {/* Content panel */}
      <div className="flex-1 space-y-5">
        <Skeleton className="h-6 w-48 rounded-sm" />
        <FormSkeleton />
      </div>
    </div>
  );
}

const variantMap: Record<Variant, (props: Props) => React.JSX.Element> = {
  table: (p) => <TableSkeleton rows={p.rows} cols={p.cols} />,
  cards: (p) => <CardsSkeleton cards={p.cards} />,
  form: () => <FormSkeleton />,
  board: () => <BoardSkeleton />,
  settings: () => <SettingsSkeleton />,
};

export function PageSkeleton({
  variant = "table",
  rows,
  cols,
  cards,
  showHero = true,
  showFilterBar = false,
}: Props) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {showHero && <HeroSkeleton />}
      {showFilterBar && <FilterBarSkeleton />}
      {variantMap[variant]({ variant, rows, cols, cards, showHero, showFilterBar })}
    </div>
  );
}
