import type { PendingReview } from "@/lib/repositories/types";
import { VideoIcon } from "./icons";

type PendingReviewsPanelProps = {
  reviews: PendingReview[];
  totalPending?: number;
};

export function PendingReviewsPanel({ reviews, totalPending }: PendingReviewsPanelProps) {
  return (
    <div className="w-full lg:w-[316px] shrink-0 bg-card border border-line rounded-(--radius) p-5 shadow-card lg:h-full">
      <div className="flex items-center gap-[9px] mb-1">
        <div className="w-[30px] h-[30px] rounded-lg bg-brand-soft text-brand-d flex items-center justify-center shrink-0">
          <VideoIcon />
        </div>
        <div className="text-[14.5px] font-bold text-ink">Pending video reviews</div>
      </div>
      <div className="text-[11.5px] text-muted mb-4">
        {totalPending ?? reviews.length} player submissions awaiting coach feedback
      </div>

      <div className="flex flex-col gap-[11px]">
        {reviews.map((review) => (
          <div
            key={`${review.drill}-${review.player}`}
            className="flex gap-[11px] items-center p-[11px] border border-line rounded-xl"
          >
            <div
              className="w-[46px] h-[34px] rounded-[7px] flex items-center justify-center shrink-0"
              style={{ background: review.thumbnailGradient }}
            >
              <VideoIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[12.5px] text-text">{review.drill}</div>
              <div className="text-[11.5px] text-muted">
                {review.player} · {review.timeAgo}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="w-full mt-4 inline-flex items-center justify-center bg-ink text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px]"
      >
        Open review queue
      </button>
    </div>
  );
}
