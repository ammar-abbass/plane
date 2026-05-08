export function IssueBoardSkeleton() {
  return (
    <div className="p-5">
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, col) => (
          <div key={col} className="flex w-72 shrink-0 flex-col gap-2">
            <div className="flex items-center gap-2 px-1 py-1.5">
              <div className="h-3.5 w-3.5 rounded-full shimmer" />
              <div className="h-3 w-20 rounded shimmer" />
            </div>
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: col === 0 ? 3 : col === 1 ? 2 : 1 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border/60 bg-card p-3 space-y-2">
                  <div className="h-3.5 w-full rounded shimmer" />
                  <div className="h-3 w-2/3 rounded shimmer" />
                  <div className="flex justify-between">
                    <div className="h-3 w-8 rounded shimmer" />
                    <div className="h-5 w-20 rounded shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
