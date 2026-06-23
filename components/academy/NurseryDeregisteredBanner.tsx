"use client";

type NurseryDeregisteredBannerProps = {
  compact?: boolean;
};

export function NurseryDeregisteredBanner({ compact = false }: NurseryDeregisteredBannerProps) {
  return (
    <div
      className={`shrink-0 border-b border-[#F5D9A8] bg-[#FFF8EB] ${
        compact ? "px-4 py-3" : "px-4 sm:px-6 lg:px-[26px] py-4"
      }`}
    >
      <p className="text-[13px] font-bold text-[#9A6700]">Nursery deregistered by state</p>
      <p className="text-[12px] text-[#9A6700]/85 mt-0.5 leading-relaxed">
        This academy portal is view-only until the admin completes nursery re-registration and the
        state approves it again.
      </p>
    </div>
  );
}
