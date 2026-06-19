import Link from "next/link";
import { portalCrossLinks, type CuratedPortalId } from "@/lib/auth-config";

type PortalLoginCrossLinksProps = {
  current: CuratedPortalId;
};

export function PortalLoginCrossLinks({ current }: PortalLoginCrossLinksProps) {
  const links = portalCrossLinks.filter((link) => link.id !== current);

  return (
    <nav
      aria-label="Other sign-in portals"
      className="pt-4 border-t border-line2 min-w-0"
    >
      <p className="text-[11.5px] font-semibold uppercase tracking-wide text-muted2 mb-3">
        Sign in as(demo only)
      </p>
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
