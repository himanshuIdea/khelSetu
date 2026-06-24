import Link from "next/link";
import { AuthMarketingHero } from "@/components/marketing/AuthMarketingHero";
import {
  getPortalLandingConfig,
  type PortalLandingId,
} from "@/lib/portal-landing-config";

const SIGN_IN_CLASS =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10 w-full sm:w-auto";

const SIGN_IN_MOBILE_CLASS =
  "inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10 w-full sm:w-auto";

const SIGN_UP_CLASS =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-6 text-sm font-semibold text-white transition-colors hover:bg-brand/90 w-full sm:w-auto";

const SIGN_UP_MOBILE_CLASS =
  "inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-6 text-sm font-semibold text-white transition-colors hover:bg-brand/90 w-full sm:w-auto";

type PortalLandingPageProps = {
  portal: PortalLandingId;
};

export function PortalLandingPage({ portal }: PortalLandingPageProps) {
  const config = getPortalLandingConfig(portal);
  const isMobileFirst = config.layout === "mobileFirst";

  const innerClassName = isMobileFirst
    ? "px-5 py-8 sm:px-10 max-w-xl mx-auto w-full lg:max-w-3xl lg:px-12 lg:py-16"
    : "px-6 py-10 sm:px-10 max-w-xl mx-auto w-full lg:max-w-3xl lg:px-12 lg:py-16";

  const stepsClassName = isMobileFirst
    ? "mt-8 sm:mt-10 gap-4 sm:gap-5"
    : "mt-10 gap-5";

  const headlineClassName = isMobileFirst
    ? "text-[24px] font-bold leading-tight tracking-tight sm:text-[32px]"
    : undefined;

  const signInClass = isMobileFirst ? SIGN_IN_MOBILE_CLASS : SIGN_IN_CLASS;
  const signUpClass = isMobileFirst ? SIGN_UP_MOBILE_CLASS : SIGN_UP_CLASS;

  return (
    <AuthMarketingHero
      headline={config.headline}
      subcopy={config.subcopy}
      steps={config.steps}
      activeStep={config.activeStep}
      glowVariant="landing"
      className="min-h-dvh"
      innerClassName={innerClassName}
      stepsClassName={stepsClassName}
      {...(headlineClassName ? { headlineClassName } : {})}
    >
      <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3">
        <Link href={config.signInHref} className={signInClass}>
          Sign in
        </Link>
        {config.showSignUp && config.signUpHref ? (
          <Link href={config.signUpHref} className={signUpClass}>
            Sign up
          </Link>
        ) : null}
      </div>
      {config.helperText ? (
        <p className="mt-4 text-xs sm:text-sm text-[#8E9BB8] leading-relaxed max-w-md">
          {config.helperText}
        </p>
      ) : null}
    </AuthMarketingHero>
  );
}
