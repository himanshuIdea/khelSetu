import { PageBody } from "@/components/academy/shared";

export default function CoachPostDrillLoading() {
  return (
    <PageBody className="max-w-lg mx-auto w-full">
      <div className="animate-pulse min-w-0" aria-busy aria-label="Loading post drill">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-[38px] h-[38px] bg-line rounded-[11px]" />
          <div className="h-5 w-36 bg-line rounded" />
        </div>
        <div className="h-[44px] bg-line rounded-[10px] border border-line mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="h-[44px] bg-line rounded-[10px]" />
          <div className="h-[44px] bg-line rounded-[10px]" />
        </div>
        <div className="h-[88px] bg-line rounded-[10px] mb-4" />
        <div className="h-[220px] bg-line rounded-(--radius) border border-line mb-4" />
        <div className="h-[44px] bg-line rounded-[10px]" />
      </div>
    </PageBody>
  );
}
