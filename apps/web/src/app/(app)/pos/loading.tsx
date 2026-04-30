import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function PosLoading() {
  return (
    <div className="p-4">
      <PageSkeleton variant="cards" cards={8} showHero={false} />
    </div>
  );
}
