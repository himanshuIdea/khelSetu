export default function PlayerLoading() {
  return (
    <div className="flex flex-1 flex-col min-h-0 animate-pulse px-4 py-3" aria-busy aria-label="Loading">
      <div className="h-7 w-40 bg-line rounded-lg mb-4 shrink-0" />
      <div className="h-[208px] bg-line rounded-[18px] mb-3.5 shrink-0" />
      <div className="h-[208px] bg-line rounded-[18px] shrink-0" />
    </div>
  );
}
