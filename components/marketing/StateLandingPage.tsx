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

const RAIL = "lg:mr-[380px] xl:mr-[440px]";

const FEATURE_PILLS = [
  { label: "Manage", dotClass: "bg-brand", borderClass: "border-brand/70" },
  { label: "Train", dotClass: "bg-green", borderClass: "border-green/70" },
  { label: "Connect", dotClass: "bg-blue", borderClass: "border-blue/70" },
] as const;

type Accent = "brand" | "green" | "blue";

const ACCENT: Record<Accent, { text: string; border: string; glow: string }> = {
  brand: { text: "text-brand", border: "border-brand/30", glow: "bg-brand/10" },
  green: { text: "text-green", border: "border-green/30", glow: "bg-green/10" },
  blue: { text: "text-blue", border: "border-blue/30", glow: "bg-blue/10" },
};

const FEATURES: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: Accent;
}[] = [
  {
    icon: <GridIcon className="w-5 h-5" />,
    title: "State overview",
    desc: "A live command centre aggregating every nursery, athlete and rupee across Haryana on one dashboard.",
    accent: "brand",
  },
  {
    icon: <CapIcon className="w-5 h-5" />,
    title: "Sports nurseries",
    desc: "One verified registry of every academy and nursery — location, sports offered, capacity and status.",
    accent: "green",
  },
  {
    icon: <UsersIcon className="w-5 h-5" />,
    title: "Athletes",
    desc: "Track every registered athlete statewide with sport, district and performance history in one roster.",
    accent: "blue",
  },
  {
    icon: <SearchIcon className="w-5 h-5" />,
    title: "Talent scouting",
    desc: "Shortlist athletes by sport, district and rating to build the pipeline for the 2036 Olympic squad.",
    accent: "brand",
  },
  {
    icon: <ShieldIcon className="w-5 h-5" />,
    title: "Verification",
    desc: "Review verified, pending and flagged records so support only ever follows genuine, audited talent.",
    accent: "green",
  },
  {
    icon: <CashIcon className="w-5 h-5" />,
    title: "Fund utilisation",
    desc: "Release scheme grants, track disbursement and audit every rupee down to the receiving academy.",
    accent: "blue",
  },
  {
    icon: <PinIcon className="w-5 h-5" />,
    title: "Districts",
    desc: "Compare coverage and performance across all districts to find the gaps that need investment.",
    accent: "brand",
  },
  {
    icon: <ChartIcon className="w-5 h-5" />,
    title: "Reports",
    desc: "Generate leadership-ready reports and exports for reviews and budget decisions in a single click.",
    accent: "green",
  },
];

const STEPS: { n: string; title: string; desc: string }[] = [
  {
    n: "01",
    title: "Register & onboard",
    desc: "Districts and academies submit nurseries; the state approves onboarding requests from one queue.",
  },
  {
    n: "02",
    title: "Verify the ground truth",
    desc: "Infrastructure and athletes are verified, flagged or held — building a base the state can trust.",
  },
  {
    n: "03",
    title: "Track performance",
    desc: "Athlete progress and academy output roll up to a statewide view that updates in real time.",
  },
  {
    n: "04",
    title: "Scout for 2036",
    desc: "Filter the verified pool to shortlist medal prospects and feed the Olympic preparation pathway.",
  },
  {
    n: "05",
    title: "Disburse & audit funds",
    desc: "Scheme grants flow to the right academies with a full, inspectable disbursement trail.",
  },
  {
    n: "06",
    title: "Report to leadership",
    desc: "Every metric is one export away — for cabinet reviews, audits and budget planning.",
  },
];

function MissionOlympicHeading({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden>
      <p className="font-bold leading-[0.9] tracking-tight text-left lg:text-center">
        <span className="block text-[36px] sm:text-[44px] lg:text-[clamp(2.5rem,3.6vw,3.6rem)] text-white/30">
          Mission
        </span>
        <span className="block text-[40px] sm:text-[48px] lg:text-[clamp(2.75rem,4.2vw,4.25rem)] text-white mt-1">
          Olympic <span className="text-brand">2036</span>
        </span>
        <span className="block text-[34px] sm:text-[42px] lg:text-[clamp(2.25rem,3.4vw,3.4rem)] text-brand/90 mt-2 lg:mt-3 tracking-[0.04em]">
          Vijaybhava
        </span>
      </p>
    </div>
  );
}

function SignInButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/auth/state/login"
      className={`inline-flex min-h-11 items-center justify-center rounded-full border border-brand/60 bg-brand px-7 text-[13px] font-semibold text-white shadow-[0_10px_28px_rgba(255,107,44,0.22)] transition-[background,box-shadow] hover:bg-brand-d hover:shadow-[0_12px_32px_rgba(255,107,44,0.28)] ${className}`}
    >
      Sign in
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

export function StateLandingPage() {
  return (
    <div className="relative min-h-dvh text-white">
      <StateLandingBackdrop />

      {/* Fixed brand lockup (whole page) + compact Sign in on mobile/tablet */}
      <StateLandingHeader />

      {/* Fixed Mission Olympic 2036 + Sign in rail (desktop) */}
      <aside className="hidden lg:flex fixed top-0 right-0 z-30 h-screen w-[380px] xl:w-[440px] flex-col items-center justify-center px-10">
        <MissionOlympicHeading className="w-full max-w-md" />
        <SignInButton className="mt-16 w-full max-w-[260px]" />
        <p className="mt-6 text-center text-[11px] text-[#7E8BA8]">
          State portal access for the Government of Haryana
        </p>
      </aside>

      <main className={`relative z-10 ${RAIL}`}>
        {/* Hero */}
        <section className="flex min-h-[88vh] flex-col justify-center px-6 sm:px-12 lg:px-16 pt-24 pb-16 lg:pt-28">
          <div className="max-w-3xl">
            <p className="text-[11px] sm:text-[14px] font-semibold uppercase tracking-[0.14em] text-brand">
              Government of Haryana · The road to 2036
            </p>
            <h1 className="mt-5 sm:mt-6 text-[42px] sm:text-[56px] lg:text-[64px] font-bold leading-[1.05] tracking-tight">
              KhelSetu
            </h1>
            <p className="mt-6 sm:mt-8 text-[15px] sm:text-[17px] lg:text-[18px] text-[#D8DEEA] leading-relaxed max-w-2xl">
              From the village akhara to the 2036 Olympic podium — one bridge for
              every academy, athlete and coach in Haryana, governed from a single
              state command centre.
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

            {/* Mission Olympic shown inline below lg (rail is desktop-only) */}
            <div className="mt-12 lg:hidden">
              <MissionOlympicHeading />
            </div>

            <div className="mt-12 flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-[#7E8BA8]">
              <span>Scroll to explore</span>
              <span className="h-px w-12 bg-white/20" aria-hidden />
            </div>
          </div>
        </section>

        {/* Thesis */}
        <section className="px-6 sm:px-12 lg:px-16 py-16 lg:py-24">
          <Reveal>
            <SectionHeading
              eyebrow="Why KhelSetu"
              title="One command centre for the entire sporting pipeline"
              desc="Today, talent, infrastructure and grants live in scattered registers and PDFs. KhelSetu replaces them with a single verified system — so the state can see every nursery, athlete and rupee, and act on what the data shows."
            />
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-3 max-w-3xl">
            {[
              { value: "1", label: "verified source of truth", accent: "brand" as Accent },
              { value: "22", label: "districts on one map", accent: "green" as Accent },
              { value: "2036", label: "the goal everything ladders to", accent: "blue" as Accent },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 80} className="h-full">
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6">
                  <div className={`text-[32px] font-bold leading-none ${ACCENT[stat.accent].text}`}>
                    {stat.value}
                  </div>
                  <div className="mt-2 text-[13px] text-[#9DB0D8]">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Feature walkthrough */}
        <section className="px-6 sm:px-12 lg:px-16 py-16 lg:py-24">
          <Reveal>
            <SectionHeading
              eyebrow="Inside the state portal"
              title="Everything the directorate needs, in one place"
              desc="Each module of the state portal maps to a real job — from registering nurseries to releasing funds and reporting to leadership."
            />
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature, i) => {
              const accent = ACCENT[feature.accent];
              return (
                <Reveal key={feature.title} delay={(i % 2) * 80}>
                  <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 transition-colors hover:border-white/20 hover:bg-white/[0.05]">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent.glow} ${accent.text}`}
                    >
                      {feature.icon}
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

        {/* How it works — real sequence */}
        <section className="px-6 sm:px-12 lg:px-16 py-16 lg:py-24">
          <Reveal>
            <SectionHeading
              eyebrow="How it works"
              title="From registration to the podium"
              desc="A single governed flow the state runs end to end."
            />
          </Reveal>

          <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
            {STEPS.map((step, i) => (
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

        {/* Closing CTA */}
        <section className="px-6 sm:px-12 lg:px-16 py-16 lg:py-24">
          <Reveal>
            <div className="rounded-3xl border border-brand/30 bg-linear-to-br from-brand/15 via-white/[0.03] to-transparent p-8 sm:p-12">
              <h2 className="text-[26px] sm:text-[36px] font-bold leading-[1.1] tracking-tight">
                Ready to govern the road to 2036?
              </h2>
              <p className="mt-4 max-w-xl text-[15px] sm:text-[17px] leading-relaxed text-[#D8DEEA]">
                Sign in to the Haryana state portal to manage nurseries, verify
                athletes, scout talent and disburse funds — all from one screen.
              </p>
            </div>
          </Reveal>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 px-6 sm:px-12 lg:px-16 pt-12 pb-10">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <MarketingBrandLockup marginless />
              <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-[#7E8BA8]">
                The bridge from grassroots sport to the Olympic podium for the
                Government of Haryana.
              </p>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5d6b88]">
                Other portals
              </h4>
              <ul className="mt-4 space-y-3 text-[14px] text-[#9DB0D8]">
                <li>
                  <Link href="/academy" className="hover:text-white">
                    Academy portal
                  </Link>
                </li>
                <li>
                  <Link href="/coach" className="hover:text-white">
                    Coach portal
                  </Link>
                </li>
                <li>
                  <Link href="/player" className="hover:text-white">
                    Athlete app
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5d6b88]">
                Governance
              </h4>
              <ul className="mt-4 space-y-3 text-[14px] text-[#9DB0D8]">
                <li>Verification &amp; audit</li>
                <li>Fund utilisation</li>
                <li>Statewide reporting</li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5d6b88]">
                Get started
              </h4>
              <ul className="mt-4 space-y-3 text-[14px] text-[#9DB0D8]">
                <li>
                  <Link href="/auth/state/login" className="hover:text-white">
                    State portal sign in
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-[12px] text-[#7E8BA8] sm:flex-row sm:items-center sm:justify-between">
            <span>Prepared for the Government of Haryana · Panchkula, Haryana</span>
            <span>© {new Date().getFullYear()} KhelSetu</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
