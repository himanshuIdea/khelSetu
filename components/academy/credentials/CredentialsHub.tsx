import Link from "next/link";
import { CapIcon, UsersIcon } from "@/components/academy/icons";
import type { CredentialSummary } from "@/lib/repositories/credentials";

type CredentialsHubProps = {
  academyId: string;
  summary: CredentialSummary;
};

function SupportIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

const tiles = [
  {
    key: "athletes" as const,
    label: "Athletes",
    description: "Player portal usernames & passwords",
    href: (id: string) => `/academy/${id}/credentials/athletes`,
    icon: UsersIcon,
    color: "bg-brand-soft text-brand-d",
    countKey: "athletes" as const,
  },
  {
    key: "coaches" as const,
    label: "Coaches",
    description: "Coach accounts for academy access",
    href: (id: string) => `/academy/${id}/credentials/coaches`,
    icon: CapIcon,
    color: "bg-blue-soft text-blue",
    countKey: "coaches" as const,
  },
  {
    key: "staff" as const,
    label: "Support staff",
    description: "Physio, admin, and support roles",
    href: (id: string) => `/academy/${id}/credentials/staff`,
    icon: SupportIcon,
    color: "bg-green-soft text-green",
    countKey: "staff" as const,
  },
];

export function CredentialsHub({ academyId, summary }: CredentialsHubProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0 w-full">
      {tiles.map((tile) => {
        const counts = summary[tile.countKey];
        const Icon = tile.icon;
        const pending = counts.total - counts.provisioned;

        return (
          <Link
            key={tile.key}
            href={tile.href(academyId)}
            className="group block bg-card border border-line rounded-2xl p-5 shadow-sm hover:border-brand/40 hover:shadow-md transition-all min-w-0"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tile.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-muted2 group-hover:text-brand transition-colors">→</span>
            </div>
            <h2 className="text-[16px] font-bold text-ink mb-1">{tile.label}</h2>
            <p className="text-[12.5px] text-muted leading-snug mb-4">{tile.description}</p>
            <div className="flex flex-wrap gap-2 text-[11.5px] font-semibold">
              <span className="px-2.5 py-1 rounded-full bg-surface text-muted">
                {counts.total} total
              </span>
              <span className="px-2.5 py-1 rounded-full bg-green-soft text-[#0E9B72]">
                {counts.provisioned} provisioned
              </span>
              {pending > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-brand-soft text-brand-d">
                  {pending} pending
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
