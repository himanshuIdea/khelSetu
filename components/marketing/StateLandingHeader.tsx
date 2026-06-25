"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MarketingBrandLockup } from "@/components/marketing/MarketingBrandLockup";

/**
 * Fixed landing header. The brand lockup gains a frosted-glass backing once
 * the page scrolls, so it never visually collides with content passing under.
 */
export function StateLandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 sm:px-12 lg:px-16 h-16 lg:h-20">
      <div
        className={`rounded-2xl px-3 py-1.5 border transition-colors duration-300 ${
          scrolled
            ? "bg-white/[0.06] backdrop-blur-md border-white/10 shadow-[0_8px_28px_rgba(11,22,44,0.45)]"
            : "bg-transparent border-transparent"
        }`}
      >
        <MarketingBrandLockup marginless />
      </div>

      <Link
        href="/auth/state/login"
        className="lg:hidden inline-flex min-h-11 items-center justify-center rounded-full border border-brand/60 bg-brand px-5 text-[13px] font-semibold text-white shadow-[0_10px_28px_rgba(255,107,44,0.22)] transition-[background,box-shadow] hover:bg-brand-d"
      >
        Sign in
      </Link>
    </header>
  );
}
