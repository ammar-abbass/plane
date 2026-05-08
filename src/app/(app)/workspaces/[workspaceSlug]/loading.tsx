export default function WorkspaceLoading() {
  return (
    <div className="flex h-screen flex-col">
      {/* Header skeleton */}
      <div className="flex h-[52px] items-center border-b border-border/60 px-5">
        <div className="h-4 w-32 rounded shimmer" />
      </div>
      {/* Content skeleton */}
      <div className="mx-auto max-w-4xl space-y-6 p-6 w-full">
        <div className="h-5 w-24 rounded shimmer" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg border border-border/60 shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
