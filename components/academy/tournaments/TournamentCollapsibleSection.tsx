"use client";

import { useState } from "react";
import { SectionTitle } from "@/components/academy/shared";

function AccordionChevron({ expanded }: { expanded: boolean }) {
  return (
    <span
      className={`shrink-0 flex items-center justify-center w-8 h-8 text-muted transition-transform duration-200 ${
        expanded ? "rotate-90" : ""
      }`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

type TournamentCollapsibleSectionProps = {
  title: string;
  subtitle?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
  /** When true, desktop renders children only (no SectionTitle wrapper). */
  bareDesktop?: boolean;
};

export function TournamentCollapsibleSection({
  title,
  subtitle,
  defaultExpanded = false,
  children,
  className = "",
  bareDesktop = false,
}: TournamentCollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <>
      <div className={`lg:hidden ${className}`}>
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="w-full flex items-center justify-between gap-2 py-2.5 text-left min-h-[44px]"
          aria-expanded={expanded}
        >
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-ink">{title}</div>
            {subtitle ? <div className="text-[11px] text-muted mt-0.5">{subtitle}</div> : null}
          </div>
          <AccordionChevron expanded={expanded} />
        </button>
        {expanded ? <div className="pb-3">{children}</div> : null}
      </div>

      <div className={`hidden lg:block ${className}`}>
        {bareDesktop ? children : (
          <>
            <SectionTitle title={title} subtitle={subtitle} />
            <div className="mt-3">{children}</div>
          </>
        )}
      </div>
    </>
  );
}
