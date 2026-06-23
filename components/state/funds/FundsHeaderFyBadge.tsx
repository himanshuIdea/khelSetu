"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EditFyAllocationModal } from "@/components/state/funds/EditFyAllocationModal";

type FundsHeaderFyBadgeProps = {
  fiscalYearLabel: string;
  fyTotalAllocatedPaise: number;
};

export function FundsHeaderFyBadge({
  fiscalYearLabel,
  fyTotalAllocatedPaise,
}: FundsHeaderFyBadgeProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  async function handleSaved() {
    setModalOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="hidden sm:inline-flex items-center gap-[5px] text-[11px] font-semibold px-3 py-[7px] rounded-full bg-green-soft text-[#0E9B72] hover:bg-[#D4F5EC] transition-colors"
        aria-label={`Manage FY ${fiscalYearLabel} total allocation`}
      >
        <span className="w-[7px] h-[7px] rounded-full bg-green" />
        FY {fiscalYearLabel}
      </button>

      <EditFyAllocationModal
        fiscalYearLabel={fiscalYearLabel}
        fyTotalAllocatedPaise={fyTotalAllocatedPaise}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </>
  );
}
