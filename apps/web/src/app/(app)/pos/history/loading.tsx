import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function HistoryLoading() {
  return (
    <div className="p-6">
      <PageSkeleton variant="table" cols={6} rows={8} showHero={false} />
    </div>
  );
}
