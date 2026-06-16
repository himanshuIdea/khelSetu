"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, CheckIcon } from "@/components/academy/icons";
import { InlineDatePicker } from "@/components/academy/InlineDatePicker";
import { InlineSelect } from "@/components/academy/InlineSelect";
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
import {
  todayDateString,
  type AttendanceFormOptions,
  type AttendanceMarkSession,
  type AttendanceMarkStatus,
  type BatchAttendanceHistoryEntry,
} from "@/lib/attendance";
import { StaffAttendanceSection } from "@/components/academy/StaffAttendanceSection";
import type { AttendanceSession } from "@/lib/repositories/types";

type AttendanceTab = "athletes" | "staff";

type AttendanceWorkspaceProps = {
  academyId: string;
  formOptions: AttendanceFormOptions;
  sessions: AttendanceSession[];
  children?: React.ReactNode;
};

type LocalStatusMap = Record<string, AttendanceMarkStatus | null>;

function buildLocalStatus(roster: AttendanceMarkSession["roster"]): LocalStatusMap {
  return Object.fromEntries(roster.map((entry) => [entry.playerId, entry.status]));
}

function AttendanceStatusActions({
  status,
  onPresent,
  onAbsent,
}: {
  status: AttendanceMarkStatus | null;
  onPresent: () => void;
  onAbsent: () => void;
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
    </div>
  );
}

export function AttendanceWorkspace({
  academyId,
  formOptions,
  sessions,
  children,
}: AttendanceWorkspaceProps) {
  const router = useRouter();
  const defaultSportId = formOptions.sports[0]?.id ?? "";
  const defaultBatchId =
    formOptions.batches.find((batch) => batch.sportId === defaultSportId)?.id ?? "";

  const [sportId, setSportId] = useState(defaultSportId);
  const [batchId, setBatchId] = useState(defaultBatchId);
  const [date, setDate] = useState(todayDateString());
  const [markSession, setMarkSession] = useState<AttendanceMarkSession | null>(null);
  const [history, setHistory] = useState<BatchAttendanceHistoryEntry[]>([]);
  const [localStatus, setLocalStatus] = useState<LocalStatusMap>({});
  const [loadingMark, setLoadingMark] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AttendanceTab>("athletes");

  const sportOptions = useMemo(
    () => formOptions.sports.map((sport) => ({ value: sport.id, label: sport.name })),
    [formOptions.sports]
  );

  const batchOptions = useMemo(
    () =>
      formOptions.batches
        .filter((batch) => batch.sportId === sportId)
        .map((batch) => ({ value: batch.id, label: batch.name })),
    [formOptions.batches, sportId]
  );

  const selectedBatchLabel = batchOptions.find((option) => option.value === batchId)?.label ?? "batch";

  useEffect(() => {
    if (!sportId && formOptions.sports[0]) {
      setSportId(formOptions.sports[0].id);
    }
  }, [formOptions.sports, sportId]);

  useEffect(() => {
    if (!batchOptions.some((option) => option.value === batchId)) {
      setBatchId(batchOptions[0]?.value ?? "");
    }
  }, [batchOptions, batchId]);

  const loadMarkSession = useCallback(async () => {
    if (!batchId) {
      setMarkSession(null);
      setLocalStatus({});
      return;
    }

    setLoadingMark(true);
    setError(null);
    try {
      const data = await api.attendance.getMarkSession(academyId, batchId, date);
      setMarkSession(data);
      setLocalStatus(buildLocalStatus(data.roster));
    } catch (loadError) {
      setMarkSession(null);
      setLocalStatus({});
      setError(loadError instanceof Error ? loadError.message : "Could not load roster.");
    } finally {
      setLoadingMark(false);
    }
  }, [academyId, batchId, date]);

  const loadHistory = useCallback(async () => {
    if (!batchId) {
      setHistory([]);
      return;
    }

    setLoadingHistory(true);
    try {
      const rows = await api.attendance.batchHistory(academyId, batchId);
      setHistory(rows);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [academyId, batchId]);

  useEffect(() => {
    void loadMarkSession();
  }, [loadMarkSession]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleSportChange = (nextSportId: string) => {
    setSportId(nextSportId);
    setSaveMessage(null);
    const nextBatch = formOptions.batches.find((batch) => batch.sportId === nextSportId);
    setBatchId(nextBatch?.id ?? "");
  };

  const handleStatusChange = (playerId: string, status: AttendanceMarkStatus) => {
    setLocalStatus((current) => ({ ...current, [playerId]: status }));
    setSaveMessage(null);
  };

  const handleMarkAllPresent = () => {
    if (!markSession) return;
    setLocalStatus(
      Object.fromEntries(markSession.roster.map((entry) => [entry.playerId, "present" as const]))
    );
    setSaveMessage(null);
  };

  const dirty = useMemo(() => {
    if (!markSession) return false;
    return markSession.roster.some((entry) => localStatus[entry.playerId] !== entry.status);
  }, [localStatus, markSession]);

  const markedCount = useMemo(
    () => Object.values(localStatus).filter((status) => status != null).length,
    [localStatus]
  );

  const handleSave = async () => {
    if (!batchId || !markSession) return;

    const records = Object.entries(localStatus)
      .filter((entry): entry is [string, AttendanceMarkStatus] => entry[1] != null)
      .map(([playerId, status]) => ({ playerId, status }));

    if (records.length === 0) {
      setError("Mark at least one player as present or absent before saving.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const result = await api.attendance.saveMarkSession(academyId, { batchId, date, records });
      setSaveMessage(`Saved — ${result.present}/${result.total} present (${result.rate}).`);
      await loadMarkSession();
      await loadHistory();
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const jumpToSession = (session: AttendanceSession) => {
    if (!session.batchId) return;
    setSportId(session.sportId);
    setBatchId(session.batchId);
    setDate(session.date);
    setSaveMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasSports = formOptions.sports.length > 0;
  const hasBatches = batchOptions.length > 0;

  return (
    <div className="min-w-0 w-full">
      {children}

      <div className="flex gap-1 p-1 mb-4 rounded-[11px] border border-line bg-surface/60 w-full sm:w-fit min-w-0">
        <button
          type="button"
          onClick={() => setActiveTab("athletes")}
          className={`flex-1 sm:flex-none min-h-[40px] px-4 rounded-[9px] text-[13px] font-semibold transition-colors ${
            activeTab === "athletes"
              ? "bg-card text-ink shadow-card border border-line"
              : "text-muted hover:text-ink"
          }`}
        >
          Athletes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("staff")}
          className={`flex-1 sm:flex-none min-h-[40px] px-4 rounded-[9px] text-[13px] font-semibold transition-colors ${
            activeTab === "staff"
              ? "bg-card text-ink shadow-card border border-line"
              : "text-muted hover:text-ink"
          }`}
        >
          Staff
        </button>
      </div>

      {activeTab === "staff" ? (
        <StaffAttendanceSection academyId={academyId} />
      ) : null}

      {activeTab === "athletes" ? (
      <>
      <div className="bg-card border border-line rounded-(--radius) shadow-card p-4 sm:p-5 mb-4 min-w-0">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-[10px] bg-brand-soft text-brand-d flex items-center justify-center shrink-0"
            aria-hidden
          >
            <CalendarIcon className="w-[18px] h-[18px]" />
          </div>
          <SectionTitle
            title="Mark attendance"
            subtitle="Select sport, batch and date — then mark each player present or absent."
          />
        </div>

        {!hasSports ? (
          <EmptyState
            compact
            className="mt-4 border-0 shadow-none"
            icon={<CalendarIcon className="w-5 h-5" />}
            title="No sports configured"
            description="Add sports during academy onboarding to start marking attendance."
          />
        ) : (
          <div className="mt-4 rounded-[11px] border border-line2 bg-surface/50 p-3 sm:p-3.5 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 min-w-0">
              <div className="min-w-0">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-muted2 mb-1.5">
                  Sport
                </label>
                <InlineSelect
                  value={sportId}
                  onChange={handleSportChange}
                  options={sportOptions}
                  aria-label="Sport"
                  variant="input"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-muted2 mb-1.5">
                  Batch
                </label>
                <InlineSelect
                  value={batchId}
                  onChange={(value) => {
                    setBatchId(value);
                    setSaveMessage(null);
                  }}
                  options={batchOptions}
                  disabled={!hasBatches}
                  placeholder={hasBatches ? "Select batch" : "No batches"}
                  aria-label="Batch"
                  variant="input"
                />
              </div>
              <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                <InlineDatePicker
                  label="Date"
                  layout="stacked"
                  value={date}
                  onChange={(value) => {
                    setDate(value);
                    setSaveMessage(null);
                  }}
                  maxDate={todayDateString()}
                />
              </div>
            </div>
          </div>
        )}

        {hasSports && hasBatches && (
          <div className="mt-4 pt-4 border-t border-line2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 min-w-0">
              {loadingMark ? (
                <span className="text-[12.5px] text-muted">Loading roster…</span>
              ) : markSession ? (
                <>
                  <span className="text-[12.5px] text-muted">
                    <span className="font-semibold text-ink tabular-nums">{markedCount}</span>
                    <span className="text-muted2 mx-0.5">/</span>
                    <span className="font-semibold text-ink tabular-nums">{markSession.totalPlayers}</span>
                    <span className="ml-1.5">players marked</span>
                  </span>
                  {markSession.isMarked ? (
                    <Pill variant="green">
                      <CheckIcon className="w-3 h-3" />
                      Saved
                    </Pill>
                  ) : dirty ? (
                    <Pill variant="amber">Unsaved changes</Pill>
                  ) : null}
                </>
              ) : (
                <span className="text-[12.5px] text-muted">Select a batch to load the roster.</span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                disabled={!markSession || loadingMark || saving}
                className="min-h-[44px] px-3.5 rounded-[10px] border border-line bg-card text-[12.5px] font-semibold text-text transition-colors hover:bg-surface disabled:opacity-50 disabled:hover:bg-card w-full sm:w-auto"
              >
                Mark all present
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!markSession || loadingMark || saving || !dirty}
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-[10px] bg-brand text-white text-[13px] font-semibold transition-colors hover:bg-brand-d disabled:opacity-50 disabled:hover:bg-brand w-full sm:w-auto"
              >
                {!saving && dirty ? <CheckIcon className="w-3.5 h-3.5" /> : null}
                {saving ? "Saving…" : markSession?.isMarked ? "Update attendance" : "Save attendance"}
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-[12.5px] text-red">{error}</p>}
        {saveMessage && <p className="mt-3 text-[12.5px] text-green font-medium">{saveMessage}</p>}
      </div>

      {hasSports && !hasBatches && (
        <EmptyState
          icon={<CalendarIcon className="w-5 h-5" />}
          title="No batches for this sport"
          description="Batches are created per sport during onboarding. Switch sport or complete onboarding."
          className="mb-4"
        />
      )}

      {hasSports && hasBatches && !loadingMark && markSession && markSession.roster.length === 0 && (
        <EmptyState
          icon={<CalendarIcon className="w-5 h-5" />}
          title="No players in this batch"
          description="Add players to this batch from the Players screen before marking attendance."
          className="mb-4"
        />
      )}

      {hasSports && hasBatches && markSession && markSession.roster.length > 0 && (
        <div className="min-w-0 w-full mb-4">
          <AcademyCardList>
            {markSession.roster.map((entry) => {
              const status = localStatus[entry.playerId] ?? null;
              const wasMarked = entry.status != null;
              return (
                <AcademyCardListItem key={entry.playerId}>
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar initials={entry.initials} color={entry.avatarColor} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13.5px] font-semibold text-ink">{entry.name}</span>
                        {wasMarked && !dirty && (
                          <Pill variant={entry.status === "present" ? "green" : "red"}>
                            {entry.status === "present" ? "Marked present" : "Marked absent"}
                          </Pill>
                        )}
                        {status != null && status !== entry.status && (
                          <Pill variant="amber">Edited</Pill>
                        )}
                      </div>
                      <div className="mt-2">
                        <AttendanceStatusActions
                          status={status}
                          onPresent={() => handleStatusChange(entry.playerId, "present")}
                          onAbsent={() => handleStatusChange(entry.playerId, "absent")}
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
            headers={["Player", "Status", "Actions"]}
            columnWidths={["38%", "18%", "44%"]}
            minWidth={640}
          >
              {markSession.roster.map((entry) => {
                const status = localStatus[entry.playerId] ?? null;
                return (
                  <TableRow key={entry.playerId}>
                    <TableCell>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar initials={entry.initials} color={entry.avatarColor} size="sm" />
                        <div className="min-w-0">
                          <div className="font-semibold text-ink truncate">{entry.name}</div>
                          {entry.status != null && !dirty && (
                            <div className="text-[11px] text-muted mt-0.5">
                              Previously {entry.status}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {status == null ? (
                        <Pill variant="grey">Unmarked</Pill>
                      ) : (
                        <Pill variant={status === "present" ? "green" : "red"}>
                          {status === "present" ? "Present" : "Absent"}
                        </Pill>
                      )}
                    </TableCell>
                    <TableCell>
                      <AttendanceStatusActions
                        status={status}
                        onPresent={() => handleStatusChange(entry.playerId, "present")}
                        onAbsent={() => handleStatusChange(entry.playerId, "absent")}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
          </AcademyTable>
        </div>
      )}

      {hasSports && hasBatches && (
        <div className="min-w-0 w-full mb-4">
          <SectionTitle
            title="Batch attendance record"
            subtitle={`Complete session history for ${selectedBatchLabel}.`}
          />
          {loadingHistory ? (
            <div className="mt-3 text-[12.5px] text-muted">Loading history…</div>
          ) : history.length === 0 ? (
            <EmptyState
              compact
              className="mt-3"
              icon={<CalendarIcon className="w-5 h-5" />}
              title="No attendance history yet"
              description="Marked sessions for this batch will appear here with present and absent counts."
            />
          ) : (
            <>
              <AcademyCardList className="mt-3 lg:hidden">
                {history.map((row) => (
                  <AcademyCardListItem key={row.sessionId}>
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-semibold text-ink">{row.dateLabel}</div>
                        <div className="text-[12px] text-muted mt-0.5">
                          {row.present} present · {row.absent} absent · {row.total} players
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[14px] font-bold text-ink">{row.rate}</div>
                        <Pill variant={row.status === "marked" ? "green" : row.status === "upcoming" ? "amber" : "grey"}>
                          {row.status}
                        </Pill>
                      </div>
                    </div>
                  </AcademyCardListItem>
                ))}
              </AcademyCardList>

              <AcademyTable
                className="hidden lg:block mt-3 min-w-0 w-full"
                headers={["Date", "Present", "Absent", "Total", "Rate", "Status"]}
                columnWidths={["28%", "14%", "14%", "12%", "14%", "18%"]}
                minWidth={600}
              >
                  {history.map((row) => (
                    <TableRow key={row.sessionId}>
                      <TableCell>
                        <b>{row.dateLabel}</b>
                      </TableCell>
                      <TableCell>{row.present}</TableCell>
                      <TableCell>{row.absent}</TableCell>
                      <TableCell>{row.total}</TableCell>
                      <TableCell>
                        <b>{row.rate}</b>
                      </TableCell>
                      <TableCell>
                        <Pill variant={row.status === "marked" ? "green" : row.status === "upcoming" ? "amber" : "grey"}>
                          {row.status}
                        </Pill>
                      </TableCell>
                    </TableRow>
                  ))}
              </AcademyTable>
            </>
          )}
        </div>
      )}

      <div className="min-w-0 w-full">
        <SectionTitle title="Recent sessions" subtitle="All batches — tap a row to jump to marking." />
        {sessions.length === 0 ? (
          <EmptyState
            compact
            className="mt-3"
            icon={<CalendarIcon className="w-5 h-5" />}
            title="No sessions yet"
            description="Marked or scheduled sessions will show up here across all sports and batches."
          />
        ) : (
          <>
            <AcademyCardList className="mt-3 lg:hidden">
              {sessions.map((session) => (
                <AcademyCardListItem
                  key={session.id}
                  onClick={() => jumpToSession(session)}
                >
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold text-ink">{session.batch}</div>
                      <div className="text-[12px] text-muted mt-0.5">
                        {session.sport} · {session.coach} · {session.time}
                      </div>
                      <div className="text-[12px] text-muted mt-1">
                        {session.present > 0 ? `${session.present} / ${session.total}` : `— / ${session.total}`} present
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[14px] font-bold text-ink">{session.rate}</div>
                      <Pill variant={session.statusVariant}>{session.status}</Pill>
                    </div>
                  </div>
                </AcademyCardListItem>
              ))}
            </AcademyCardList>

            <AcademyTable
              className="hidden lg:block mt-3 min-w-0 w-full"
              headers={["Batch", "Sport", "Coach", "Time", "Present", "Rate", "Status"]}
              columnWidths={["18%", "14%", "20%", "14%", "14%", "10%", "10%"]}
              minWidth={720}
            >
                {sessions.map((session) => (
                  <TableRow key={session.id} onClick={() => jumpToSession(session)}>
                    <TableCell>
                      <b>{session.batch}</b>
                    </TableCell>
                    <TableCell>{session.sport}</TableCell>
                    <TableCell>{session.coach}</TableCell>
                    <TableCell>{session.time}</TableCell>
                    <TableCell>
                      {session.present > 0 ? `${session.present} / ${session.total}` : `— / ${session.total}`}
                    </TableCell>
                    <TableCell>
                      <b>{session.rate}</b>
                    </TableCell>
                    <TableCell>
                      <Pill variant={session.statusVariant}>{session.status}</Pill>
                    </TableCell>
                  </TableRow>
                ))}
            </AcademyTable>
          </>
        )}
      </div>
      </>
      ) : null}
    </div>
  );
}
