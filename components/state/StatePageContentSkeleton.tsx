/** Main content-area skeleton while a state page streams (inside StateLayoutClient). */
export function StatePageContentSkeleton() {
  return (
    <div className="flex-1 min-h-0 overflow-hidden animate-pulse px-4 md:px-[26px] py-4 space-y-4">
      <div className="h-7 w-48 bg-line rounded-md" />
      <div className="h-4 w-72 bg-line rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[88px] bg-line rounded-(--radius)" />
        ))}
      </div>
      <div className="h-64 bg-line rounded-(--radius)" />
    </div>
  );
}
