"use client";

import Link from "next/link";
import {
  CapIcon,
  CashIcon,
  ChartIcon,
  GridIcon,
  PinIcon,
  SearchIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/academy/icons";
import { MarketingBrandLockup } from "@/components/marketing/MarketingBrandLockup";
import { Reveal } from "@/components/marketing/Reveal";
import { StateLandingBackdrop } from "@/components/marketing/StateLandingBackdrop";
import { StateLandingHeader } from "@/components/marketing/StateLandingHeader";
import {
  StateLandingLanguageProvider,
  useStateLandingLanguage,
} from "@/components/marketing/StateLandingLanguage";
import type { StateLandingCopy } from "@/lib/state-landing-i18n";

const RAIL = "lg:mr-[380px] xl:mr-[440px]";

type Accent = "brand" | "green" | "blue";

const ACCENT: Record<Accent, { text: string; border: string; glow: string }> = {
  brand: { text: "text-brand", border: "border-brand/30", glow: "bg-brand/10" },
  green: { text: "text-green", border: "border-green/30", glow: "bg-green/10" },
  blue: { text: "text-blue", border: "border-blue/30", glow: "bg-blue/10" },
};

const FEATURE_META: {
  id: string;
  icon: React.ReactNode;
  accent: Accent;
}[] = [
  { id: "overview", icon: <GridIcon className="w-5 h-5" />, accent: "brand" },
  { id: "nurseries", icon: <CapIcon className="w-5 h-5" />, accent: "green" },
  { id: "athletes", icon: <UsersIcon className="w-5 h-5" />, accent: "blue" },
  { id: "scouting", icon: <SearchIcon className="w-5 h-5" />, accent: "brand" },
  { id: "verification", icon: <ShieldIcon className="w-5 h-5" />, accent: "green" },
  { id: "funds", icon: <CashIcon className="w-5 h-5" />, accent: "blue" },
  { id: "districts", icon: <PinIcon className="w-5 h-5" />, accent: "brand" },
  { id: "reports", icon: <ChartIcon className="w-5 h-5" />, accent: "green" },
];

const PILL_META = [
  { key: "manage" as const, dotClass: "bg-brand", borderClass: "border-brand/70" },
  { key: "train" as const, dotClass: "bg-green", borderClass: "border-green/70" },
  { key: "connect" as const, dotClass: "bg-blue", borderClass: "border-blue/70" },
];

const STAT_META = [
  { value: "1", key: "one" as const, accent: "brand" as Accent },
  { value: "22", key: "districts" as const, accent: "green" as Accent },
  { value: "2036", key: "goal" as const, accent: "blue" as Accent },
];

function MissionOlympicHeading({
  t,
  className = "",
}: {
  t: StateLandingCopy;
  className?: string;
}) {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden>
      <p className="flex flex-col gap-2 lg:gap-2.5 text-left lg:text-center">
        {/* Opaque muted — text-white/30 bleeds when the bright line below overlaps Devanagari */}
        <span className="block leading-none text-[36px] sm:text-[44px] lg:text-[clamp(2.5rem,3.6vw,3.6rem)] font-bold text-[#7E8BA8]">
          {t.mission}
        </span>
        <span className="block leading-none text-[40px] sm:text-[48px] lg:text-[clamp(2.75rem,4.2vw,4.25rem)] font-bold text-white tracking-tight">
          {t.olympic} <span className="text-brand">2036</span>
        </span>
        <span className="block leading-none text-[34px] sm:text-[42px] lg:text-[clamp(2.25rem,3.4vw,3.4rem)] font-bold text-brand/90 tracking-[0.04em]">
          {t.vijaybhava}
        </span>
      </p>
    </div>
  );
}

function SignInButton({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <Link
      href="/auth/state/login"
      className={`inline-flex min-h-11 items-center justify-center rounded-full border border-brand/60 bg-brand px-7 text-[13px] font-semibold text-white shadow-[0_10px_28px_rgba(255,107,44,0.22)] transition-[background,box-shadow] hover:bg-brand-d hover:shadow-[0_12px_32px_rgba(255,107,44,0.28)] ${className}`}
    >
      {label}
    </Link>
  );
}

function SectionHeading({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-[11px] sm:text-[13px] font-semibold uppercase tracking-[0.16em] text-brand">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-[26px] sm:text-[34px] lg:text-[40px] font-bold leading-[1.1] tracking-tight">
        {title}
      </h2>
      {desc ? (
        <p className="mt-4 text-[15px] sm:text-[17px] text-[#D8DEEA] leading-relaxed">
          {desc}
        </p>
      ) : null}
    </div>
  );
}

function StateLandingPageContent() {
  const { locale, t } = useStateLandingLanguage();

  return (
    <div
      className="relative min-h-dvh text-white"
      lang={locale === "hi" ? "hi" : "en"}
    >
      <StateLandingBackdrop />
      <StateLandingHeader />

      <aside className="hidden lg:flex fixed top-0 right-0 z-30 h-screen w-[380px] xl:w-[440px] flex-col items-center justify-center px-10">
        <MissionOlympicHeading t={t} className="w-full max-w-md" />
        <SignInButton label={t.signIn} className="mt-16 w-full max-w-[260px]" />
        <p className="mt-6 text-center text-[11px] text-[#7E8BA8]">{t.railHint}</p>
      </aside>

      <main className={`relative z-10 ${RAIL}`}>
        <section className="flex min-h-[88vh] flex-col justify-center px-6 sm:px-12 lg:px-16 pt-24 pb-16 lg:pt-28">
          <div className="max-w-3xl">
            <p className="text-[11px] sm:text-[14px] font-semibold uppercase tracking-[0.14em] text-brand">
              {t.heroEyebrow}
            </p>
            <h1 className="mt-5 sm:mt-6 text-[42px] sm:text-[56px] lg:text-[64px] font-bold leading-[1.05] tracking-tight">
              KhelSetu
            </h1>
            <p className="mt-6 sm:mt-8 text-[15px] sm:text-[17px] lg:text-[18px] text-[#D8DEEA] leading-relaxed max-w-2xl">
              {t.heroBody}
            </p>

            <div className="mt-8 sm:mt-10 flex flex-wrap gap-2.5 sm:gap-3">
              {PILL_META.map((pill) => (
                <span
                  key={pill.key}
                  className={`inline-flex items-center gap-2 rounded-full border bg-white/[0.04] px-4 py-2 text-[13px] font-semibold text-white ${pill.borderClass}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${pill.dotClass}`}
                    aria-hidden
                  />
                  {t.pills[pill.key]}
                </span>
              ))}
            </div>

            <div className="mt-12 lg:hidden">
              <MissionOlympicHeading t={t} />
            </div>

            <div className="mt-12 flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-[#7E8BA8]">
              <span>{t.scrollCue}</span>
              <span className="h-px w-12 bg-white/20" aria-hidden />
            </div>
          </div>
        </section>

        <section className="px-6 sm:px-12 lg:px-16 py-16 lg:py-24">
          <Reveal>
            <SectionHeading
              eyebrow={t.whyEyebrow}
              title={t.whyTitle}
              desc={t.whyDesc}
            />
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-3 max-w-3xl">
            {STAT_META.map((stat, i) => (
              <Reveal key={stat.key} delay={i * 80} className="h-full">
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6">
                  <div
                    className={`text-[32px] font-bold leading-none ${ACCENT[stat.accent].text}`}
                  >
                    {stat.value}
                  </div>
                  <div className="mt-2 text-[13px] text-[#9DB0D8]">
                    {t.stats[stat.key]}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="px-6 sm:px-12 lg:px-16 py-16 lg:py-24">
          <Reveal>
            <SectionHeading
              eyebrow={t.portalEyebrow}
              title={t.portalTitle}
              desc={t.portalDesc}
            />
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {FEATURE_META.map((meta, i) => {
              const feature = t.features.find((f) => f.id === meta.id);
              if (!feature) return null;
              const accent = ACCENT[meta.accent];
              return (
                <Reveal key={meta.id} delay={(i % 2) * 80}>
                  <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 transition-colors hover:border-white/20 hover:bg-white/[0.05]">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent.glow} ${accent.text}`}
                    >
                      {meta.icon}
                    </div>
                    <h3 className="mt-4 text-[17px] font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-[#9DB0D8]">
                      {feature.desc}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section className="px-6 sm:px-12 lg:px-16 py-16 lg:py-24">
          <Reveal>
            <SectionHeading
              eyebrow={t.howEyebrow}
              title={t.howTitle}
              desc={t.howDesc}
            />
          </Reveal>

          <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
            {t.steps.map((step, i) => (
              <li key={step.n} className="h-full bg-[#0E1B33] p-6 sm:p-7">
                <Reveal delay={(i % 2) * 80}>
                  <span className="text-[13px] font-bold tracking-[0.2em] text-brand">
                    {step.n}
                  </span>
                  <h3 className="mt-3 text-[17px] font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#9DB0D8]">
                    {step.desc}
                  </p>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        <section className="px-6 sm:px-12 lg:px-16 py-16 lg:py-24">
          <Reveal>
            <div className="rounded-3xl border border-brand/30 bg-linear-to-br from-brand/15 via-white/[0.03] to-transparent p-8 sm:p-12">
              <h2 className="text-[26px] sm:text-[36px] font-bold leading-[1.1] tracking-tight">
                {t.ctaTitle}
              </h2>
              <p className="mt-4 max-w-xl text-[15px] sm:text-[17px] leading-relaxed text-[#D8DEEA]">
                {t.ctaDesc}
              </p>
            </div>
          </Reveal>
        </section>

        <footer className="border-t border-white/10 px-6 sm:px-12 lg:px-16 pt-12 pb-10">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <MarketingBrandLockup marginless />
              <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-[#7E8BA8]">
                {t.footerTagline}
              </p>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5d6b88]">
                {t.footerOtherPortals}
              </h4>
              <ul className="mt-4 space-y-3 text-[14px] text-[#9DB0D8]">
                <li>
                  <Link href="/academy" className="hover:text-white">
                    {t.footerAcademy}
                  </Link>
                </li>
                <li>
                  <Link href="/coach" className="hover:text-white">
                    {t.footerCoach}
                  </Link>
                </li>
                <li>
                  <Link href="/player" className="hover:text-white">
                    {t.footerAthlete}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5d6b88]">
                {t.footerGovernance}
              </h4>
              <ul className="mt-4 space-y-3 text-[14px] text-[#9DB0D8]">
                <li>{t.footerVerification}</li>
                <li>{t.footerFunds}</li>
                <li>{t.footerReporting}</li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5d6b88]">
                {t.footerGetStarted}
              </h4>
              <ul className="mt-4 space-y-3 text-[14px] text-[#9DB0D8]">
                <li>
                  <Link href="/auth/state/login" className="hover:text-white">
                    {t.footerSignIn}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-[12px] text-[#7E8BA8] sm:flex-row sm:items-center sm:justify-between">
            <span>{t.footerPrepared}</span>
            <span>© {new Date().getFullYear()} KhelSetu</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export function StateLandingPageClient() {
  return (
    <StateLandingLanguageProvider>
      <StateLandingPageContent />
    </StateLandingLanguageProvider>
  );
}
