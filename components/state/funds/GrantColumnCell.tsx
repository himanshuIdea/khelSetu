"use client";

import { TableCell } from "@/components/academy/shared";
import { GrantStatusPill } from "@/components/state/funds/GrantDisbursementModal";
import type { StateFundGrantSummary } from "@/lib/state-portal";

const GRANT_ACTION_BUTTON_CLASS =
  "inline-flex items-center justify-center shrink-0 whitespace-nowrap min-h-[24px] px-2 rounded-[7px] border border-line bg-card text-[11px] font-semibold text-brand hover:bg-brand-soft/40 disabled:opacity-50 transition-colors";

function GrantActionButton({
  grant,
  onGrant,
  onMarkGranted,
  marking,
}: {
  grant: StateFundGrantSummary;
  onGrant: () => void;
  onMarkGranted: (disbursementId: string) => void;
  marking: boolean;
}) {
  if (grant.status === "paid") return null;

  if (grant.status === "pending" && grant.disbursementId) {
    return (
      <button
        type="button"
        onClick={() => onMarkGranted(grant.disbursementId!)}
        disabled={marking}
        title="Mark as granted"
        className={GRANT_ACTION_BUTTON_CLASS}
      >
        {marking ? "Saving…" : "Mark"}
      </button>
    );
  }

  return (
    <button type="button" onClick={onGrant} className={GRANT_ACTION_BUTTON_CLASS}>
      Grant
    </button>
  );
}

export function GrantColumnCell({
  grant,
  onGrant,
  onMarkGranted,
  marking,
}: {
  grant: StateFundGrantSummary;
  onGrant: () => void;
  onMarkGranted: (disbursementId: string) => void;
  marking: boolean;
}) {
  const action =
    grant.status === "paid" ? null : (
      <GrantActionButton
        grant={grant}
        onGrant={onGrant}
        onMarkGranted={onMarkGranted}
        marking={marking}
      />
    );

  const pill =
    grant.status === "none" ? null : (
      <GrantStatusPill status={grant.status} amountPaise={grant.amountPaise} compact />
    );

  return (
    <TableCell className="min-w-0 pr-0">
      <div className="flex items-center justify-end gap-1 min-w-0 max-w-full overflow-hidden">
        {pill ? <div className="min-w-0 shrink truncate">{pill}</div> : null}
        {action}
      </div>
    </TableCell>
  );
}
