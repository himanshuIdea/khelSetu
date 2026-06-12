import Link from "next/link";
import { PlusIcon, VideoIcon } from "@/components/academy/icons";
import { PhoneShell } from "@/components/mobile/PhoneShell";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" aria-hidden="true">
      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

export default function MobileSubmitPage() {
  return (
    <PhoneShell showTabBar={false}>
      <div className="flex items-center gap-3 px-[18px] pb-3.5 shrink-0">
        <Link href="/mobile/home" className="w-[38px] h-[38px] rounded-[11px] bg-card border border-line flex items-center justify-center text-ink">
          <BackIcon />
        </Link>
        <div className="text-[17px] font-bold text-ink">Submit drill video</div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-[22px] bg-brand-soft border border-[#FFD9C5] flex items-center justify-center mb-4">
          <VideoIcon className="w-9 h-9 text-brand" />
        </div>
        <h2 className="text-lg font-bold text-ink mb-2">Record or upload</h2>
        <p className="text-[13px] text-muted leading-relaxed mb-6">
          Submit today&apos;s drill for coach review. You can also run AI Form Check before sending.
        </p>
        <button type="button" className="inline-flex items-center gap-2 bg-brand text-white font-semibold text-[13px] py-3 px-5 rounded-[12px] mb-3 w-full max-w-[260px] justify-center">
          <PlusIcon />
          Record video
        </button>
        <Link href="/mobile/ai-form" className="text-[13px] font-semibold text-brand">
          Run AI Form Check first →
        </Link>
      </div>
    </PhoneShell>
  );
}
