export default function IssueDetailLoading() {
  return (
    <div className="flex h-screen flex-col">
      <div className="flex h-[52px] items-center border-b border-border/60 px-5">
        <div className="h-4 w-16 rounded shimmer" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 space-y-4 p-6">
          <div className="h-7 w-3/4 rounded shimmer" />
          <div className="h-4 w-full rounded shimmer" />
          <div className="h-4 w-2/3 rounded shimmer" />
        </div>
        <div className="w-72 shrink-0 space-y-4 border-l border-border/60 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 rounded shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
