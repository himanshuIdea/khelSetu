"use client";

import { useMemo, useState } from "react";
import { ApprovePayslipDialog } from "@/components/academy/ApprovePayslipDialog";
import { DeleteStaffDialog } from "@/components/academy/DeleteStaffDialog";
import { ManageStaffModal } from "@/components/academy/ManageStaffModal";
import { RunPayrollDialog } from "@/components/academy/RunPayrollDialog";
import {
  CheckIcon,
  ClockIcon,
  CapIcon,
  CashIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/academy/icons";
import {
  AcademyCardList,
  AcademyCardListItem,
  AcademyTable,
  Avatar,
  EmptyState,
  Pill,
  StatCard,
  StatGrid,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import type { StaffMember } from "@/lib/repositories/types";

type PayrollStaffSectionProps = {
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
};

const payrollIcons = {
  users: UsersIcon,
  cash: CashIcon,
  cap: CapIcon,
  clock: ClockIcon,
};

export function PayrollStaffSection({
  academyId,
  monthLabel,
  payrollStats,
  staffMembers,
}: PayrollStaffSectionProps) {
  const [manageOpen, setManageOpen] = useState(false);
  const [editStaffId, setEditStaffId] = useState<string | null>(null);
  const [deleteStaff, setDeleteStaff] = useState<StaffMember | null>(null);
  const [runOpen, setRunOpen] = useState(false);
  const [approveStaff, setApproveStaff] = useState<StaffMember | StaffMember[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const pendingStaff = useMemo(
    () => staffMembers.filter((member) => member.canApprove && member.payslipId),
    [staffMembers]
  );

  const allPendingSelected =
    pendingStaff.length > 0 && pendingStaff.every((member) => selectedIds.has(member.staffId));

  function toggleSelect(staffId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(staffId)) next.delete(staffId);
      else next.add(staffId);
      return next;
    });
  }

  function toggleSelectAllPending() {
    if (allPendingSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingStaff.map((member) => member.staffId)));
    }
  }

  const selectedPending = staffMembers.filter(
    (member) => member.canApprove && selectedIds.has(member.staffId)
  );

  function openAdd() {
    setEditStaffId(null);
    setManageOpen(true);
  }

  function openEdit(member: StaffMember) {
    setEditStaffId(member.staffId);
    setManageOpen(true);
  }

  return (
    <div className="min-w-0 w-full">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end mb-4">
        <button
          type="button"
          onClick={openAdd}
          className="min-h-[44px] px-4 rounded-[10px] border border-line bg-card text-[13px] font-semibold text-text hover:bg-surface w-full sm:w-auto"
        >
          Manage staff
        </button>
        <button
          type="button"
          onClick={() => setRunOpen(true)}
          className="min-h-[44px] px-4 rounded-[10px] bg-brand text-white text-[13px] font-semibold hover:bg-brand-d w-full sm:w-auto"
        >
          Run payroll
        </button>
      </div>

      <StatGrid>
        {payrollStats.map((stat) => {
          const Icon = payrollIcons[stat.icon];
          return (
            <StatCard
              key={stat.label}
              value={stat.value}
              label={stat.label}
              icon={<Icon className="w-5 h-5" />}
              iconBg={stat.iconBg}
              iconColor={stat.iconColor}
              compact
            />
          );
        })}
      </StatGrid>

      {selectedPending.length > 0 && (
        <div className="mb-3 flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-[10px] border border-brand/20 bg-brand-soft/40 min-w-0">
          <span className="text-[13px] font-semibold text-ink flex-1 min-w-0">
            {selectedPending.length} selected
          </span>
          <button
            type="button"
            onClick={() => setApproveStaff(selectedPending)}
            className="min-h-[40px] px-3.5 rounded-[9px] bg-brand text-white text-[12.5px] font-semibold w-full sm:w-auto"
          >
            Approve selected
          </button>
        </div>
      )}

      {pendingStaff.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleSelectAllPending}
            className="text-[12.5px] font-semibold text-brand hover:text-brand-d"
          >
            {allPendingSelected ? "Clear selection" : "Select all pending"}
          </button>
          {pendingStaff.length > 0 && (
            <button
              type="button"
              onClick={() => setApproveStaff(pendingStaff)}
              className="text-[12.5px] font-semibold text-muted hover:text-ink"
            >
              Approve all pending ({pendingStaff.length})
            </button>
          )}
        </div>
      )}

      {staffMembers.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="w-5 h-5" />}
          title="No staff on payroll"
          description="Add coaches and support staff to track attendance, salaries and monthly disbursements."
        />
      ) : (
        <>
          <AcademyCardList className="lg:hidden mb-4">
            {staffMembers.map((member) => (
              <AcademyCardListItem key={member.staffId}>
                <div className="flex items-start gap-3 min-w-0">
                  {member.canApprove ? (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(member.staffId)}
                      onChange={() => toggleSelect(member.staffId)}
                      className="mt-1 w-4 h-4 rounded border-line accent-brand shrink-0"
                      aria-label={`Select ${member.name}`}
                    />
                  ) : (
                    <span className="w-4 shrink-0" />
                  )}
                  <Avatar initials={member.initials} color={member.avatarColor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[13.5px] text-ink">{member.name}</div>
                    <div className="text-[12px] text-muted mt-0.5">
                      {member.role} · {member.type}
                    </div>
                    <div className="text-[12px] text-muted mt-1">
                      {member.daysPresent} days · <b>{member.salary}</b>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Pill variant={member.statusVariant}>
                        {member.statusVariant === "green" ? <CheckIcon /> : <ClockIcon className="w-[11px] h-[11px]" />}
                        {member.status}
                      </Pill>
                      {member.canApprove && (
                        <button
                          type="button"
                          onClick={() => setApproveStaff(member)}
                          className="text-[12px] font-semibold text-brand"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEdit(member)}
                        className="p-1.5 rounded-[8px] border border-line text-muted hover:text-ink"
                        aria-label={`Edit ${member.name}`}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteStaff(member)}
                        className="p-1.5 rounded-[8px] border border-line text-muted hover:text-red"
                        aria-label={`Delete ${member.name}`}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </AcademyCardListItem>
            ))}
          </AcademyCardList>

          <AcademyTable
            className="hidden lg:block min-w-0 w-full"
            headers={["", "Staff member", "Role", "Type", "Days present", "Monthly salary", "Status", "Actions"]}
            columnWidths={["4%", "20%", "18%", "10%", "12%", "14%", "10%", "12%"]}
            minWidth={900}
          >
            {staffMembers.map((member) => (
              <TableRow key={member.staffId}>
                <TableCell>
                  {member.canApprove ? (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(member.staffId)}
                      onChange={() => toggleSelect(member.staffId)}
                      className="w-4 h-4 rounded border-line accent-brand"
                      aria-label={`Select ${member.name}`}
                    />
                  ) : null}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-[11px] min-w-0">
                    <Avatar initials={member.initials} color={member.avatarColor} />
                    <div className="font-semibold text-[13px] text-ink truncate">{member.name}</div>
                  </div>
                </TableCell>
                <TableCell>{member.role}</TableCell>
                <TableCell>{member.type}</TableCell>
                <TableCell>{member.daysPresent}</TableCell>
                <TableCell>
                  <b>{member.salary}</b>
                </TableCell>
                <TableCell>
                  <Pill variant={member.statusVariant}>
                    {member.statusVariant === "green" ? <CheckIcon /> : <ClockIcon className="w-[11px] h-[11px]" />}
                    {member.status}
                  </Pill>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {member.canApprove && (
                      <button
                        type="button"
                        onClick={() => setApproveStaff(member)}
                        className="text-[12px] font-semibold text-brand whitespace-nowrap"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(member)}
                      className="p-1.5 rounded-[8px] border border-line text-muted hover:text-ink"
                      aria-label={`Edit ${member.name}`}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteStaff(member)}
                      className="p-1.5 rounded-[8px] border border-line text-muted hover:text-red"
                      aria-label={`Delete ${member.name}`}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </AcademyTable>
        </>
      )}

      <ManageStaffModal
        academyId={academyId}
        open={manageOpen}
        staffId={editStaffId}
        onClose={() => {
          setManageOpen(false);
          setEditStaffId(null);
        }}
      />
      <DeleteStaffDialog
        academyId={academyId}
        staff={deleteStaff}
        open={Boolean(deleteStaff)}
        onClose={() => setDeleteStaff(null)}
      />
      <RunPayrollDialog
        academyId={academyId}
        open={runOpen}
        monthLabel={monthLabel}
        onClose={() => setRunOpen(false)}
      />
      <ApprovePayslipDialog
        academyId={academyId}
        staff={approveStaff}
        open={Boolean(approveStaff)}
        onClose={() => setApproveStaff(null)}
      />
    </div>
  );
}
