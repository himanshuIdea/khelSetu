import Link from "next/link";
import { authConfig } from "@/lib/auth-config";

function BoltIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6 text-white"
    >
      <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

type StepState = "done" | "active" | "upcoming";

function getStepState(index: number, activeStep: number): StepState {
  if (index < activeStep) return "done";
  if (index === activeStep) return "active";
  return "upcoming";
}

type AuthStepListProps = {
  steps?: readonly string[];
  activeStep: number;
  className?: string;
};

export function AuthStepList({
  steps = authConfig.steps,
  activeStep,
  className = "",
}: AuthStepListProps) {
  return (
    <div className={`flex flex-col z-[1] ${className}`}>
      {steps.map((label, index) => {
        const state = getStepState(index, activeStep);
        return (
          <div
            key={label}
            className={`flex items-center gap-3.5 text-sm ${
              state === "upcoming" ? "text-[#7E8BAC]" : "text-white"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0 border-[1.5px] ${
                state === "done"
                  ? "bg-green border-green text-white"
                  : state === "active"
                    ? "bg-brand border-brand text-white"
                    : "border-[#36476E] text-inherit"
              }`}
            >
              {state === "done" ? <CheckIcon /> : index + 1}
            </div>
            {label}
          </div>
        );
      })}
    </div>
  );
}

const HERO_GRADIENT =
  "linear-gradient(165deg, #0E1B33 0%, #16264A 60%, #1E335C 100%)";

const GLOW_GRADIENT =
  "radial-gradient(circle, rgba(255,107,44,0.32), transparent 70%)";

function AuthGlow({ className, style }: { className?: string; style: React.CSSProperties }) {
  return (
    <div
      className={`absolute rounded-full pointer-events-none ${className ?? ""}`}
      style={{
        background: GLOW_GRADIENT,
        ...style,
      }}
    />
  );
}

type AuthMarketingHeroProps = {
  headline?: string | readonly string[];
  subcopy?: string;
  activeStep: number;
  steps?: readonly string[];
  glowVariant?: "auth" | "landing";
  brandHref?: string;
  className?: string;
  innerClassName?: string;
  stepsClassName?: string;
  headlineClassName?: string;
  children?: React.ReactNode;
};

export function AuthMarketingHero({
  headline = authConfig.login.headline,
  subcopy = authConfig.login.subcopy,
  activeStep,
  steps,
  glowVariant = "auth",
  brandHref,
  className = "",
  innerClassName = "",
  stepsClassName = "mt-auto gap-5",
  headlineClassName = "text-[27px] font-bold leading-tight tracking-tight sm:text-[32px]",
  children,
}: AuthMarketingHeroProps) {
  const { brand } = authConfig;

  const brandContent = (
    <>
      <div
        className="w-[42px] h-[42px] rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: "linear-gradient(135deg, #FF6B2C, #FF9152)",
        }}
      >
        <BoltIcon />
      </div>
      <div className="text-[23px] font-bold tracking-tight">
        {brand.name}
        <span className="text-brand">{brand.accentWord}</span>
      </div>
    </>
  );

  return (
    <div
      className={`relative overflow-hidden text-white flex flex-col ${className}`}
      style={{ background: HERO_GRADIENT }}
    >
      {glowVariant === "landing" ? (
        <>
          <AuthGlow
            className="w-[360px] h-[360px] lg:hidden"
            style={{ right: -120, top: -90 }}
          />
          <AuthGlow
            className="hidden lg:block w-[480px] h-[480px]"
            style={{ right: "10%", top: "-4%" }}
          />
        </>
      ) : (
        <AuthGlow
          className="w-[360px] h-[360px]"
          style={{ right: -120, top: -90 }}
        />
      )}
      <div className={`flex flex-col flex-1 z-[1] ${innerClassName}`}>
        {brandHref ? (
          <Link
            href={brandHref}
            className="flex items-center gap-3 mb-[46px] w-fit rounded-lg hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
          >
            {brandContent}
          </Link>
        ) : (
          <div className="flex items-center gap-3 mb-[46px]">{brandContent}</div>
        )}
        <h2 className={headlineClassName}>
          {Array.isArray(headline) ? (
            headline.map((line, i) => (
              <span key={line}>
                {i > 0 && <br />}
                {line}
              </span>
            ))
          ) : (
            headline
          )}
        </h2>
        <p className="text-sm text-[#A9B5D1] mt-3.5 leading-relaxed">{subcopy}</p>
        <AuthStepList activeStep={activeStep} steps={steps} className={stepsClassName} />
        {children}
      </div>
    </div>
  );
}
