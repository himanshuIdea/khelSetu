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
};

export function AuthStepList({
  steps = authConfig.steps,
  activeStep,
}: AuthStepListProps) {
  return (
    <div className="mt-auto flex flex-col gap-5 z-[1]">
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

type AuthShellProps = {
  headline?: string | readonly string[];
  subcopy?: string;
  activeStep: number;
  progressPercent: number;
  children: React.ReactNode;
};

export function AuthShell({
  headline = authConfig.login.headline,
  subcopy = authConfig.login.subcopy,
  activeStep,
  progressPercent,
  children,
}: AuthShellProps) {
  const { brand } = authConfig;

  return (
    <div className="min-h-screen flex bg-white">
      <div
        className="hidden lg:flex w-[430px] shrink-0 flex-col relative overflow-hidden text-white px-[42px] py-[46px]"
        style={{
          background:
            "linear-gradient(165deg, #0E1B33 0%, #16264A 60%, #1E335C 100%)",
        }}
      >
        <div
          className="absolute w-[360px] h-[360px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(255,107,44,0.32), transparent 70%)",
            right: -120,
            top: -90,
          }}
        />
        <div className="flex items-center gap-3 mb-[46px] z-[1]">
          <div
            className="w-[42px] h-[42px] rounded-xl flex items-center justify-center"
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
        </div>
        <h2 className="text-[27px] font-bold leading-tight tracking-tight z-[1]">
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
        <p className="text-sm text-[#A9B5D1] mt-3.5 leading-relaxed z-[1]">
          {subcopy}
        </p>
        <AuthStepList activeStep={activeStep} />
      </div>

      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 px-6 py-10 sm:px-10 lg:px-14 lg:py-[46px]">
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

        <div className="lg:hidden mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted2 mb-1.5">
            Step {activeStep + 1} of {authConfig.steps.length}
          </p>
          <p className="text-[13px] font-semibold text-ink">{authConfig.steps[activeStep]}</p>
        </div>

        <div className="h-[5px] bg-surface rounded mb-8 lg:mb-[34px] shrink-0 overflow-hidden">
          <div
            className="h-full rounded bg-brand transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex-1 flex flex-col">{children}</div>
      </div>
    </div>
  );
}
