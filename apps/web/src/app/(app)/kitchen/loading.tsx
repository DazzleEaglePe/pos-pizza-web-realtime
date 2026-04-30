import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function KitchenLoading() {
  return (
    <div className="p-6">
      <PageSkeleton variant="board" showHero={false} />
    </div>
  );
}
