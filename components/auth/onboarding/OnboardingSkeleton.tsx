export function OnboardingSkeleton() {
  return (
    <div className="flex flex-col flex-1 w-full animate-pulse" aria-hidden>
      <div className="h-7 w-64 max-w-full bg-surface rounded-lg mb-2" />
      <div className="h-4 w-80 max-w-full bg-surface rounded mb-7" />

      <div className="h-[46px] bg-surface rounded-[11px] mb-5" />
      <div className="flex flex-col sm:flex-row gap-[18px] mb-5">
        <div className="flex-1 h-[46px] bg-surface rounded-[11px]" />
        <div className="flex-1 h-[46px] bg-surface rounded-[11px]" />
      </div>
      <div className="flex gap-2 mb-5">
        <div className="h-9 w-24 bg-surface rounded-[10px]" />
        <div className="h-9 w-20 bg-surface rounded-[10px]" />
        <div className="h-9 w-28 bg-surface rounded-[10px]" />
      </div>
      <div className="flex flex-col sm:flex-row gap-[18px] mb-5">
        <div className="flex-1 h-[46px] bg-surface rounded-[11px]" />
        <div className="flex-1 h-[34px] bg-surface rounded-[9px] mt-6" />
      </div>
    </div>
  );
}
