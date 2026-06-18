import Link from "next/link";
import { authConfig } from "@/lib/auth-config";
import { AuthMarketingHero } from "@/components/marketing/AuthMarketingHero";

export function LandingPage() {
  const { login } = authConfig;

  return (
    <AuthMarketingHero
      headline={login.headline}
      subcopy={login.subcopy}
      activeStep={0}
      className="min-h-dvh"
      innerClassName="px-6 py-10 sm:px-10 max-w-xl lg:max-w-2xl mx-auto w-full"
      stepsClassName="mt-10"
    >
      <div className="mt-10 flex flex-col sm:flex-row gap-3">
        <Link
          href="/auth/login"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          Sign in
        </Link>
        <Link
          href="/auth/sign-up"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-6 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
        >
          Sign up
        </Link>
      </div>
    </AuthMarketingHero>
  );
}
