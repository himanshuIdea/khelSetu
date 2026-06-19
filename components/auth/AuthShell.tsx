import {
  AuthMarketingHero,
  AuthStepList,
} from "@/components/marketing/AuthMarketingHero";
import { authConfig } from "@/lib/auth-config";

export { AuthStepList };

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

type AuthShellProps = {
  headline?: string | readonly string[];
  subcopy?: string;
  activeStep: number;
  progressPercent: number;
  steps?: readonly string[];
  showProgress?: boolean;
  children: React.ReactNode;
};

export function AuthShell({
  headline = authConfig.login.headline,
  subcopy = authConfig.login.subcopy,
  activeStep,
  progressPercent,
  steps = authConfig.steps,
  showProgress = true,
  children,
}: AuthShellProps) {
  const { brand } = authConfig;

  return (
    <div className="min-h-screen flex bg-white">
      <AuthMarketingHero
        headline={headline}
        subcopy={subcopy}
        activeStep={activeStep}
        steps={steps}
        className="hidden lg:flex w-[430px] shrink-0 px-[42px] py-[46px]"
        innerClassName="h-full"
        stepsClassName="mt-auto"
      />

      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 px-6 py-10 sm:px-10 lg:px-14 lg:py-[46px] min-w-0">
        <div className="lg:hidden flex items-center gap-3 mb-6 z-[1]">
          <div
            className="w-[42px] h-[42px] rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #FF6B2C, #FF9152)",
            }}
          >
            <BoltIcon />
          </div>
          <div className="text-xl font-bold tracking-tight text-ink">
            {brand.name}
            <span className="text-brand">{brand.accentWord}</span>
          </div>
        </div>

        {!showProgress ? (
          <div className="lg:hidden mb-6 min-w-0">
            <h2 className="text-[22px] font-bold leading-tight tracking-tight text-ink">
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
            <p className="text-[13px] text-muted mt-2 leading-relaxed">{subcopy}</p>
          </div>
        ) : (
          <div className="lg:hidden mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted2 mb-1.5">
              Step {activeStep + 1} of {steps.length}
            </p>
            <p className="text-[13px] font-semibold text-ink">{steps[activeStep]}</p>
          </div>
        )}

        {showProgress ? (
          <div className="h-[5px] bg-surface rounded mb-8 lg:mb-[34px] shrink-0 overflow-hidden">
            <div
              className="h-full rounded bg-brand transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        ) : null}
        <div className="flex-1 flex flex-col min-w-0">{children}</div>
      </div>
    </div>
  );
}
