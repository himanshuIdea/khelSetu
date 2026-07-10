"use client";

import { createContext, useContext, useMemo, useState } from "react";
import {
  stateLandingCopy,
  type StateLandingCopy,
  type StateLandingLocale,
} from "@/lib/state-landing-i18n";

type StateLandingLanguageContextValue = {
  locale: StateLandingLocale;
  t: StateLandingCopy;
  toggleLocale: () => void;
};

const StateLandingLanguageContext =
  createContext<StateLandingLanguageContextValue | null>(null);

export function StateLandingLanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, setLocale] = useState<StateLandingLocale>("en");

  const value = useMemo(
    () => ({
      locale,
      t: stateLandingCopy[locale],
      toggleLocale: () =>
        setLocale((current) => (current === "en" ? "hi" : "en")),
    }),
    [locale],
  );

  return (
    <StateLandingLanguageContext.Provider value={value}>
      {children}
    </StateLandingLanguageContext.Provider>
  );
}

export function useStateLandingLanguage() {
  const ctx = useContext(StateLandingLanguageContext);
  if (!ctx) {
    throw new Error(
      "useStateLandingLanguage must be used within StateLandingLanguageProvider",
    );
  }
  return ctx;
}

/** Language toggle — switches landing copy to Hindi. */
export function MatrubhashaToggle({ compact = false }: { compact?: boolean }) {
  const { locale, t, toggleLocale } = useStateLandingLanguage();

  const shortLabel = locale === "en" ? "मातृभाषा" : "EN";
  const fullLabel = locale === "en" ? t.matrubhashaLabel : t.matrubhashaSwitchToEnglish;

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={`inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-[13px] font-semibold text-white backdrop-blur-sm transition-colors hover:border-white/35 hover:bg-white/10 shrink-0 ${
        compact ? "min-w-11 px-3 sm:px-5" : "px-4 sm:px-5"
      }`}
      aria-pressed={locale === "hi"}
      aria-label={
        locale === "en"
          ? "Switch page content to Hindi"
          : "Switch page content to English"
      }
    >
      {compact ? (
        <>
          <span className="sm:hidden">{shortLabel}</span>
          <span className="hidden sm:inline">{fullLabel}</span>
        </>
      ) : (
        fullLabel
      )}
    </button>
  );
}
