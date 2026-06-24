import { PageBody } from "@/components/academy/shared";

export default function CoachSubmissionReviewLoading() {
  return (
    <PageBody className="max-w-lg mx-auto w-full">
      <div className="animate-pulse min-w-0" aria-busy aria-label="Loading submission">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-[38px] h-[38px] bg-line rounded-[11px]" />
          <div className="flex-1">
            <div className="h-5 w-40 bg-line rounded mb-2" />
            <div className="h-3 w-56 bg-line2 rounded" />
          </div>
        </div>
        <div className="h-[220px] bg-line rounded-(--radius) border border-line mb-4" />
        <div className="h-[280px] bg-line rounded-(--radius) border border-line" />
      </div>
    </PageBody>
  );
}
