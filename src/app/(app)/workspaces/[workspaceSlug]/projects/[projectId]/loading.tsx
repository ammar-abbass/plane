import { IssueBoardSkeleton } from "@/components/issues/issue-board-skeleton";

export default function ProjectLoading() {
  return (
    <div className="flex h-screen flex-col">
      <div className="flex h-[52px] items-center justify-between border-b border-border/60 px-5">
        <div className="h-4 w-32 rounded shimmer" />
        <div className="h-7 w-24 rounded shimmer" />
      </div>
      <IssueBoardSkeleton />
    </div>
  );
}
