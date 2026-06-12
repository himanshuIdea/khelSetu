export default function AcademyPageLoading() {
  return (
    <div
      className="flex-1 px-4 py-4 sm:px-6 sm:py-5 lg:px-[26px] lg:py-6 animate-pulse"
      aria-busy
      aria-label="Loading page"
    >
      <div className="h-7 w-56 max-w-full bg-line2 rounded-lg mb-2" />
      <div className="h-4 w-80 max-w-full bg-line2 rounded mb-6" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[88px] bg-line2 rounded-(--radius)" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-[280px] bg-line2 rounded-(--radius)" />
        <div className="h-[280px] bg-line2 rounded-(--radius)" />
      </div>
    </div>
  );
}
