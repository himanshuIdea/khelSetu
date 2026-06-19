"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EditFyAllocationModal } from "@/components/state/funds/EditFyAllocationModal";
import { api } from "@/lib/api";

export function FundsHeaderFyBadge() {
  const router = useRouter();
  const [fiscalYearLabel, setFiscalYearLabel] = useState("2026-27");
  const [fyTotalAllocatedPaise, setFyTotalAllocatedPaise] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { dashboard } = await api.state.funds.dashboard();
        if (!cancelled) {
          setFiscalYearLabel(dashboard.fiscalYearLabel);
          setFyTotalAllocatedPaise(dashboard.fyTotalAllocatedPaise);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaved() {
    const { dashboard } = await api.state.funds.dashboard();
    setFiscalYearLabel(dashboard.fiscalYearLabel);
    setFyTotalAllocatedPaise(dashboard.fyTotalAllocatedPaise);
    setModalOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        disabled={loading}
        className="hidden sm:inline-flex items-center gap-[5px] text-[11px] font-semibold px-3 py-[7px] rounded-full bg-green-soft text-[#0E9B72] hover:bg-[#D4F5EC] transition-colors disabled:opacity-60"
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
