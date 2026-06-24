import { authConfig } from "@/lib/auth-config";
import { WavyUnderline } from "@/components/marketing/WavyUnderline";

function BoltIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-white ${className}`}
      aria-hidden
    >
      <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

type MarketingBrandLockupProps = {
  size?: "sm" | "lg";
};

export function MarketingBrandLockup({ size = "sm" }: MarketingBrandLockupProps) {
  const { brand } = authConfig;
  const isLarge = size === "lg";

  return (
    <div className={isLarge ? "mb-10 sm:mb-14" : "mb-8 sm:mb-10"}>
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center justify-center rounded-xl shrink-0 ${
            isLarge ? "w-11 h-11" : "w-[42px] h-[42px]"
          }`}
          style={{
            background: "linear-gradient(135deg, #FF6B2C, #FF9152)",
          }}
        >
          <BoltIcon className={isLarge ? "w-7 h-7" : "w-6 h-6"} />
        </div>
        <div>
          <div
            className={`font-bold tracking-tight text-white ${
              isLarge ? "text-[26px] sm:text-[30px]" : "text-[23px]"
            }`}
          >
            {brand.name}
            <span className="text-brand">{brand.accentWord}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
