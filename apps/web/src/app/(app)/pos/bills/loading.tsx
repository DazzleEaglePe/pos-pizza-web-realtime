import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function BillsLoading() {
  return (
    <div className="p-6">
      <PageSkeleton variant="table" cols={5} rows={8} showHero={false} />
    </div>
  );
}
