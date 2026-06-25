"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MarketingBrandLockup } from "@/components/marketing/MarketingBrandLockup";
import {
  MatrubhashaToggle,
  useStateLandingLanguage,
} from "@/components/marketing/StateLandingLanguage";

/**
 * Fixed landing chrome: logo top-left, language toggle + mobile sign-in top-right.
 * Single header row avoids overlap at narrow widths.
 */
export function StateLandingHeader() {
  const { t } = useStateLandingLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 pointer-events-none">
      <div className="flex items-center justify-between gap-3 min-w-0 px-0 sm:pl-6 pr-40 lg:pl-16 h-16 lg:h-20">
        <div
          className={`pointer-events-auto min-w-0 rounded-2xl px-3 py-1.5 border transition-colors duration-300 ${
            scrolled
              ? "bg-white/[0.06] backdrop-blur-md border-white/10 shadow-[0_8px_28px_rgba(11,22,44,0.45)]"
              : "bg-transparent border-transparent"
          }`}
        >
          <MarketingBrandLockup marginless />
        </div>

        <div className="pointer-events-auto flex items-center gap-2 sm:gap-2.5 shrink-0">
          <MatrubhashaToggle />
          <Link
            href="/auth/state/login"
            className="lg:hidden inline-flex min-h-11 items-center justify-center rounded-full border border-brand/60 bg-brand px-4 sm:px-5 text-[13px] font-semibold text-white shadow-[0_10px_28px_rgba(255,107,44,0.22)] transition-[background,box-shadow] hover:bg-brand-d whitespace-nowrap"
          >
            {t.signIn}
          </Link>
        </div>
      </div>
    </header>
  );
}
