"use client";

export function DeregistrationWarningBanner() {
  return (
    <div className="rounded-2xl border border-[#F5D9A8] bg-[#FFF8EB] px-4 py-4 sm:px-5 sm:py-5 space-y-2">
      <p className="text-[14px] font-bold text-[#9A6700]">Nursery deregistration requires action</p>
      <p className="text-[13px] text-[#7A5200] leading-relaxed">
        The state has deregistered your nursery. Your academy portal is in read-only mode for coaches
        and athletes until you submit a new registration request and it is approved again.
      </p>
      <p className="text-[13px] text-[#7A5200] leading-relaxed">
        Review your academy details below, update anything that changed, and submit the
        re-registration request when ready.
      </p>
    </div>
  );
}
