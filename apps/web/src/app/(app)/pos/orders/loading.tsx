import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function OrdersLoading() {
  return (
    <div className="p-6">
      <PageSkeleton variant="cards" cards={5} showHero={false} />
    </div>
  );
}
