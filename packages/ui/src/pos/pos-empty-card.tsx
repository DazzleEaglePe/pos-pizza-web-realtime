interface PosEmptyCardProps {
  text: string;
}

/**
 * Empty-state card used in orders/history/bills lists.
 */
export function PosEmptyCard({ text }: PosEmptyCardProps) {
  return (
    <div className="bg-card border border-border rounded-sm p-6 text-sm font-semibold text-muted-foreground">
      {text}
    </div>
  );
}
