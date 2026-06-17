export function CoachShellSkeleton() {
  return (
    <div className="h-dvh overflow-hidden bg-surface animate-pulse" aria-busy aria-label="Loading coach portal">
      <div className="hidden lg:flex h-full">
        <div className="w-[236px] bg-ink shrink-0" />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-[66px] bg-card border-b border-line" />
          <div className="flex-1 bg-surface p-6 space-y-4">
            <div className="h-8 w-48 bg-line rounded" />
            <div className="h-4 w-72 bg-line2 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[120px] bg-line rounded-(--radius) border border-line" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="lg:hidden min-h-dvh max-w-lg mx-auto flex flex-col">
        <div className="h-14 bg-card border-b border-line" />
        <div className="flex-1 p-4 space-y-3">
          <div className="h-24 bg-line rounded-(--radius)" />
          <div className="h-24 bg-line rounded-(--radius)" />
        </div>
        <div className="h-[72px] bg-card border-t border-line" />
      </div>
    </div>
  );
}
