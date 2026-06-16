"use client";

import { useState } from "react";
import { PayrollStaffSection } from "@/components/academy/PayrollStaffSection";
import { PlayerFeesSection } from "@/components/academy/PlayerFeesSection";
import { PageHeader } from "@/components/academy/shared";
import type { PlayerFeeBillingRow, StaffMember } from "@/lib/repositories/types";

type FeesTab = "payroll" | "fees";

type FeesWorkspaceProps = {
  academyId: string;
  monthLabel: string;
  payrollStats: {
    value: string;
    label: string;
    iconBg: string;
    iconColor: string;
    icon: "users" | "cash" | "cap" | "clock";
  }[];
  staffMembers: StaffMember[];
  feeStats: {
    value: string;
    label: string;
    iconBg: string;
    iconColor: string;
    icon: "cash" | "clock" | "alert" | "users";
  }[];
  billingRows: PlayerFeeBillingRow[];
  formOptions: {
    sports: { id: string; name: string }[];
    batches: { id: string; name: string; sportId: string }[];
  };
};

export function FeesWorkspace({
  academyId,
  monthLabel,
  payrollStats,
  staffMembers,
  feeStats,
  billingRows,
  formOptions,
}: FeesWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<FeesTab>("payroll");

  return (
    <div className="min-w-0 w-full">
      <PageHeader
        title={
          <>
            Fees & Payroll{" "}
            <span className="text-muted font-medium text-base">· {monthLabel}</span>
          </>
        }
        subtitle="Staff salaries, payslips, and player fee billing — in one place."
      />

      <div className="flex gap-1 p-1 mb-4 rounded-[11px] border border-line bg-surface/60 w-full sm:w-fit min-w-0">
        <button
          type="button"
          onClick={() => setActiveTab("payroll")}
          className={`flex-1 sm:flex-none min-h-[40px] px-4 rounded-[9px] text-[13px] font-semibold transition-colors ${
            activeTab === "payroll"
              ? "bg-card text-ink shadow-card border border-line"
              : "text-muted hover:text-ink"
          }`}
        >
          Staff & Payroll
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("fees")}
          className={`flex-1 sm:flex-none min-h-[40px] px-4 rounded-[9px] text-[13px] font-semibold transition-colors ${
            activeTab === "fees"
              ? "bg-card text-ink shadow-card border border-line"
              : "text-muted hover:text-ink"
          }`}
        >
          Player fees
        </button>
      </div>

      {activeTab === "payroll" ? (
        <PayrollStaffSection
          academyId={academyId}
          monthLabel={monthLabel}
          payrollStats={payrollStats}
          staffMembers={staffMembers}
        />
      ) : (
        <PlayerFeesSection
          academyId={academyId}
          feeStats={feeStats}
          billingRows={billingRows}
          formOptions={formOptions}
        />
      )}
    </div>
  );
}
