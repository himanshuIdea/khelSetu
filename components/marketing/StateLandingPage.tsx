import Link from "next/link";
import { LandingGlares } from "@/components/marketing/LandingGlares";
import { MarketingBrandLockup } from "@/components/marketing/MarketingBrandLockup";

const HERO_GRADIENT =
  "linear-gradient(165deg, #0B162C 0%, #0E1B33 45%, #16264A 100%)";

const FEATURE_PILLS = [
  {
    label: "Manage",
    dotClass: "bg-brand",
    borderClass: "border-brand/70",
  },
  {
    label: "Train",
    dotClass: "bg-green",
    borderClass: "border-green/70",
  },
  {
    label: "Connect",
    dotClass: "bg-blue",
    borderClass: "border-blue/70",
  },
] as const;

function MissionOlympicHeading({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      aria-hidden
    >
      <p className="font-bold leading-[0.9] tracking-tight text-left lg:text-center">
        <span className="block text-[36px] sm:text-[44px] lg:text-[clamp(2.5rem,3.8vw,3.75rem)] text-white/30">
          Mission
        </span>
        <span className="block text-[40px] sm:text-[48px] lg:text-[clamp(2.75rem,4.5vw,4.5rem)] text-white mt-1">
          Olympic{" "}
          <span className="text-brand">2036</span>
        </span>
        <span className="block text-[34px] sm:text-[42px] lg:text-[clamp(2.25rem,3.5vw,3.5rem)] text-brand/90 mt-2 lg:mt-3 tracking-[0.04em]">
          Vijaybhava
        </span>
      </p>
    </div>
  );
}

function StateSignInButton({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <Link
        href="/auth/state/login"
        className="inline-flex min-h-11 w-full sm:w-auto sm:min-w-[148px] items-center justify-center rounded-full border border-brand/60 bg-brand px-7 text-[13px] font-semibold text-white shadow-[0_10px_28px_rgba(255,107,44,0.22)] transition-[background,box-shadow] hover:bg-brand-d hover:shadow-[0_12px_32px_rgba(255,107,44,0.28)]"
      >
        Sign in
      </Link>
    </div>
  );
}

export function StateLandingPage() {
  return (
    <div
      className="relative min-h-dvh overflow-hidden text-white flex flex-col"
      style={{ background: HERO_GRADIENT }}
    >
      <LandingGlares />

      <div className="relative z-[1] flex flex-col flex-1 px-6 py-10 sm:px-12 sm:py-12 lg:px-16 lg:py-14">
        <MarketingBrandLockup />

        <div className="flex flex-col flex-1 lg:grid lg:grid-cols-2 lg:gap-x-10 xl:gap-x-16 lg:items-center">
          <div className="flex flex-col max-w-3xl">
            <p className="text-[10px] sm:text-[14px] font-semibold uppercase tracking-[0.14em] text-brand">
              Government of Haryana · The road to 2036
            </p>

            <h1 className="mt-5 sm:mt-6 text-[42px] sm:text-[56px] lg:text-[64px] font-bold leading-[1.05] tracking-tight">
              KhelSetu
            </h1>

            <p className="mt-6 sm:mt-8 text-[15px] sm:text-[17px] lg:text-[18px] text-[#D8DEEA] leading-relaxed max-w-2xl">
              From the village akhara to the 2036 Olympic podium — one bridge for
              every academy, athlete and coach in Haryana.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-wrap gap-2.5 sm:gap-3">
            {FEATURE_PILLS.map((pill) => (
              <span
                key={pill.label}
                className={`inline-flex items-center gap-2 rounded-full border bg-white/[0.04] px-4 py-2 text-[13px] font-semibold text-white ${pill.borderClass}`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${pill.dotClass}`}
                  aria-hidden
                />
                {pill.label}
              </span>
            ))}
            </div>

            <div className="mt-10 lg:hidden">
              <MissionOlympicHeading />
              <StateSignInButton className="mt-12" />
            </div>
          </div>

          <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:w-full lg:min-h-[min(58vh,560px)]">
            <MissionOlympicHeading className="w-full max-w-md xl:max-w-lg" />
            <StateSignInButton className="mt-30 w-full max-w-md xl:max-w-lg" />
          </div>
        </div>

        <p className="mt-auto pt-12 sm:pt-16 text-[11px] sm:text-xs text-[#7E8BA8]">
          Prepared for the Government of Haryana · Panchkula, Haryana
        </p>
      </div>
    </div>
  );
}
