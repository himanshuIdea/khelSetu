"use client";

import { useState } from "react";
import Link from "next/link";
import { portalCrossLinks, type CuratedPortalId } from "@/lib/auth-config";

type PortalLoginCrossLinksProps = {
  current: CuratedPortalId;
};

export function PortalLoginCrossLinks({ current }: PortalLoginCrossLinksProps) {
  const [isHidden, setIsHidden] = useState(false);
  const links = portalCrossLinks.filter((link) => link.id !== current);

  if (isHidden) {
    return null;
  }

  return (
    <nav
      aria-label="Other sign-in portals"
      className="pt-4 border-t border-line2 min-w-0"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[11.5px] font-semibold uppercase tracking-wide text-muted2">
          Sign in as(demo only)
        </p>
        <button
          type="button"
          onClick={() => setIsHidden(true)}
          className="shrink-0 text-[11.5px] font-semibold text-muted2 hover:text-ink transition-colors"
        >
          Hide
        </button>
      </div>
      <ul className="flex flex-wrap gap-2 min-w-0">
        {links.map((link) => (
          <li key={link.id}>
            <Link
              href={link.href}
              className="inline-flex items-center min-h-[44px] px-3.5 rounded-[10px] border border-line bg-surface text-[13px] font-semibold text-ink hover:border-brand/40 hover:text-brand transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
