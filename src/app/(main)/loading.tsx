import { SkeletonCard } from "@/components/custom/SkeletonUI";

export default function Loading() {
  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
