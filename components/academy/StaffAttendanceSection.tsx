"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, CheckIcon } from "@/components/academy/icons";
import { InlineDatePicker } from "@/components/academy/InlineDatePicker";
import {
  AcademyCardList,
  AcademyCardListItem,
  AcademyTable,
  Avatar,
  EmptyState,
  Pill,
  SectionTitle,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { api } from "@/lib/api";
import { todayDateString } from "@/lib/attendance";
import type {
  StaffAttendanceSession,
  StaffAttendanceStatus,
} from "@/lib/staff-attendance";

type StaffAttendanceSectionProps = {
  academyId: string;
};

type LocalStatusMap = Record<string, StaffAttendanceStatus | null>;

function buildLocalStatus(roster: StaffAttendanceSession["roster"]): LocalStatusMap {
  return Object.fromEntries(roster.map((entry) => [entry.staffId, entry.status]));
}

function StaffStatusActions({
  status,
  onPresent,
  onAbsent,
  onLeave,
}: {
  status: StaffAttendanceStatus | null;
  onPresent: () => void;
  onAbsent: () => void;
  onLeave: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={onPresent}
        className={`min-h-[36px] px-3 rounded-full text-[12px] font-semibold border transition-colors ${
          status === "present"
            ? "bg-green-soft border-green/30 text-green"
            : "bg-card border-line text-muted hover:border-green/40"
        }`}
      >
        Present
      </button>
      <button
        type="button"
        onClick={onAbsent}
        className={`min-h-[36px] px-3 rounded-full text-[12px] font-semibold border transition-colors ${
          status === "absent"
            ? "bg-red-soft border-red/30 text-red"
            : "bg-card border-line text-muted hover:border-red/40"
        }`}
      >
        Absent
      </button>
      <button
        type="button"
        onClick={onLeave}
        className={`min-h-[36px] px-3 rounded-full text-[12px] font-semibold border transition-colors ${
          status === "leave"
            ? "bg-amber-soft border-amber/30 text-amber"
            : "bg-card border-line text-muted hover:border-amber/40"
        }`}
      >
        Leave
      </button>
    </div>
  );
}

function statusPillVariant(status: StaffAttendanceStatus | null): "green" | "red" | "amber" | "grey" {
  if (status === "present") return "green";
  if (status === "absent") return "red";
  if (status === "leave") return "amber";
  return "grey";
}

function statusLabel(status: StaffAttendanceStatus | null): string {
  if (status === "present") return "Present";
  if (status === "absent") return "Absent";
  if (status === "leave") return "Leave";
  return "Unmarked";
}

export function StaffAttendanceSection({ academyId }: StaffAttendanceSectionProps) {
  const router = useRouter();
  const [date, setDate] = useState(todayDateString());
  const [session, setSession] = useState<StaffAttendanceSession | null>(null);
  const [localStatus, setLocalStatus] = useState<LocalStatusMap>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.staffAttendance.getRoster(academyId, date);
      setSession(result);
      setLocalStatus(buildLocalStatus(result.roster));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load staff roster.");
      setSession(null);
      setLocalStatus({});
    } finally {
      setLoading(false);
    }
  }, [academyId, date]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const dirty = useMemo(() => {
    if (!session) return false;
    return session.roster.some((entry) => {
      const current = localStatus[entry.staffId] ?? null;
      return current !== entry.status;
    });
  }, [session, localStatus]);

  const markedCount = useMemo(
    () => Object.values(localStatus).filter((status) => status != null).length,
    [localStatus]
  );

  const handleStatusChange = (staffId: string, status: StaffAttendanceStatus) => {
    setLocalStatus((prev) => {
      const current = prev[staffId] ?? null;
      return { ...prev, [staffId]: current === status ? null : status };
    });
    setSaveMessage(null);
  };

  const handleMarkAllPresent = () => {
    if (!session) return;
    setLocalStatus(
      Object.fromEntries(session.roster.map((entry) => [entry.staffId, "present" as const]))
    );
    setSaveMessage(null);
  };

  const handleSave = async () => {
    if (!session) return;

    const records = Object.entries(localStatus)
      .filter((entry): entry is [string, StaffAttendanceStatus] => entry[1] != null)
      .map(([staffId, status]) => ({ staffId, status }));

    if (records.length === 0) {
      setError("Mark at least one staff member before saving.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const result = await api.staffAttendance.save(academyId, { date, records });
      setSaveMessage(
        `Saved — ${result.present} present, ${result.absent} absent, ${result.leave} on leave.`
      );
      await loadSession();
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save staff attendance.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-w-0 w-full">
      <div className="bg-card border border-line rounded-(--radius) shadow-card p-4 sm:p-5 mb-4 min-w-0">
        <div className="flex flex-col gap-4 min-w-0 sm:flex-row sm:items-start sm:gap-5">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-[10px] bg-brand-soft text-brand-d flex items-center justify-center shrink-0"
              aria-hidden
            >
              <CalendarIcon className="w-[18px] h-[18px]" />
            </div>
            <SectionTitle
              title="Mark staff attendance"
              subtitle="Select a date and mark each staff member present, absent, or on leave."
            />
          </div>

          <div className="rounded-[11px] border border-line2 bg-surface/50 p-3 sm:p-3.5 min-w-0 w-full max-w-sm sm:w-[400px] sm:max-w-none sm:shrink-0">
            <InlineDatePicker
              label="Select date"
              layout="inline"
              value={date}
              onChange={(value) => {
                setDate(value);
                setSaveMessage(null);
              }}
              maxDate={todayDateString()}
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-line2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 min-w-0">
            {loading ? (
              <span className="text-[12.5px] text-muted">Loading roster…</span>
            ) : session ? (
              <>
                <span className="text-[12.5px] text-muted">
                  <span className="font-semibold text-ink tabular-nums">{markedCount}</span>
                  <span className="text-muted2 mx-0.5">/</span>
                  <span className="font-semibold text-ink tabular-nums">{session.totalStaff}</span>
                  <span className="ml-1.5">staff marked</span>
                </span>
                {session.isMarked ? (
                  <Pill variant="green">
                    <CheckIcon className="w-3 h-3" />
                    Saved
                  </Pill>
                ) : dirty ? (
                  <Pill variant="amber">Unsaved changes</Pill>
                ) : null}
              </>
            ) : null}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleMarkAllPresent}
              disabled={!session || loading || saving || session.roster.length === 0}
              className="min-h-[44px] px-3.5 rounded-[10px] border border-line bg-card text-[12.5px] font-semibold text-text transition-colors hover:bg-surface disabled:opacity-50 disabled:hover:bg-card w-full sm:w-auto"
            >
              Mark all present
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!session || loading || saving || !dirty}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-[10px] bg-brand text-white text-[13px] font-semibold transition-colors hover:bg-brand-d disabled:opacity-50 disabled:hover:bg-brand w-full sm:w-auto"
            >
              {!saving && dirty ? <CheckIcon className="w-3.5 h-3.5" /> : null}
              {saving ? "Saving…" : session?.isMarked ? "Update attendance" : "Save attendance"}
            </button>
          </div>
        </div>

        {error && <p className="mt-3 text-[12.5px] text-red">{error}</p>}
        {saveMessage && <p className="mt-3 text-[12.5px] text-green font-medium">{saveMessage}</p>}
      </div>

      {!loading && session && session.roster.length === 0 && (
        <EmptyState
          icon={<CalendarIcon className="w-5 h-5" />}
          title="No staff members"
          description="Add staff from Fees & Payroll before marking staff attendance."
        />
      )}

      {session && session.roster.length > 0 && (
        <div className="min-w-0 w-full mb-4">
          <AcademyCardList className="lg:hidden">
            {session.roster.map((entry) => {
              const status = localStatus[entry.staffId] ?? null;
              const wasMarked = entry.status != null;
              return (
                <AcademyCardListItem key={entry.staffId}>
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar initials={entry.initials} color={entry.avatarColor} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13.5px] font-semibold text-ink">{entry.name}</span>
                        <span className="text-[11.5px] text-muted">{entry.role}</span>
                        {wasMarked && !dirty && (
                          <Pill variant={statusPillVariant(entry.status)}>
                            {statusLabel(entry.status)}
                          </Pill>
                        )}
                      </div>
                      <div className="mt-2">
                        <StaffStatusActions
                          status={status}
                          onPresent={() => handleStatusChange(entry.staffId, "present")}
                          onAbsent={() => handleStatusChange(entry.staffId, "absent")}
                          onLeave={() => handleStatusChange(entry.staffId, "leave")}
                        />
                      </div>
                    </div>
                  </div>
                </AcademyCardListItem>
              );
            })}
          </AcademyCardList>

          <AcademyTable
            className="hidden lg:block min-w-0 w-full"
            headers={["Staff member", "Role", "Status", "Actions"]}
            columnWidths={["32%", "18%", "16%", "34%"]}
            minWidth={640}
          >
            {session.roster.map((entry) => {
              const status = localStatus[entry.staffId] ?? null;
              return (
                <TableRow key={entry.staffId}>
                  <TableCell>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar initials={entry.initials} color={entry.avatarColor} size="sm" />
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate">{entry.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{entry.role}</TableCell>
                  <TableCell>
                    <Pill variant={statusPillVariant(status)}>{statusLabel(status)}</Pill>
                  </TableCell>
                  <TableCell>
                    <StaffStatusActions
                      status={status}
                      onPresent={() => handleStatusChange(entry.staffId, "present")}
                      onAbsent={() => handleStatusChange(entry.staffId, "absent")}
                      onLeave={() => handleStatusChange(entry.staffId, "leave")}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </AcademyTable>
        </div>
      )}
    </div>
  );
}
