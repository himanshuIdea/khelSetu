"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAcademyPageSearch } from "@/components/academy/AcademySearchContext";
import { AddTeamMembersModal } from "@/components/academy/AddTeamMembersModal";
import { ChangeCaptainDialog } from "@/components/academy/ChangeCaptainDialog";
import { InlineSelect } from "@/components/academy/InlineSelect";
import { CheckIcon, CloseIcon, FlagIcon, PencilIcon, PlusIcon } from "@/components/academy/icons";
import { TeamMembersEmptyState } from "@/components/academy/TeamMembersEmptyState";
import { TeamsPageHeader } from "@/components/academy/TeamsPageHeader";
import { CoachTeamsPageHeader } from "@/components/coach/CoachTeamsPageHeader";
import {
  AcademyTable,
  Avatar,
  EmptyState,
  SectionTitle,
  SidePanel,
  SplitLayout,
  TableCell,
  TableRow,
  Pill,
} from "@/components/academy/shared";
import { api, ApiError } from "@/lib/api";
import { matchesStateTextSearch } from "@/lib/state-search";
import type { TeamFormOptions, TeamMemberFormOptions } from "@/lib/teams";
import type {
  OtherTeam,
  TeamDetail,
  TeamMember,
  TeamMemberRole,
  TeamMemberSelectionStatus,
} from "@/lib/repositories/types";

function isMissingFormResult(result: string | null | undefined): boolean {
  if (result == null || result === "") return true;
  return result.toLowerCase() === "null";
}

function FormBadge({ result }: { result: string | null | undefined }) {
  const isMissing = isMissingFormResult(result);
  const isWin = result === "W";
  const isLoss = result === "L";

  const background = isMissing ? "#9AA4B8" : isWin ? "#12B886" : isLoss ? "#EF4444" : "#EF4444";
  const label = isMissing ? "N/A" : result;

  return (
    <span
      className="min-w-5 h-5 px-1.5 rounded-[5px] text-[9px] font-bold inline-flex items-center justify-center text-white"
      style={{ background }}
    >
      {label}
    </span>
  );
}

const SELECTION_OPTIONS: { value: TeamMemberSelectionStatus; label: string }[] = [
  { value: "selected", label: "Selected" },
  { value: "standby", label: "Standby" },
  { value: "not_selected", label: "Not selected" },
];

const ROLE_OPTIONS: { value: TeamMemberRole; label: string }[] = [
  { value: "captain", label: "Captain" },
  { value: "member", label: "Member" },
];

type PendingCaptainChange = {
  playerId: string;
  playerName: string;
};

type LineupSuggestion = {
  title: string;
  athleteCount: number;
  rationale: string | null;
  athletes: string[];
};

type TeamsWorkspaceProps = {
  academyId: string;
  activeTeam: TeamDetail | null;
  otherTeams: OtherTeam[];
  teamMembers: TeamMember[];
  lineupSuggestion: LineupSuggestion | null;
  memberFormOptions: TeamMemberFormOptions;
  formOptions: TeamFormOptions;
  coachId?: string;
  headerSubtitle?: string;
};

export function TeamsWorkspace({
  academyId,
  activeTeam,
  otherTeams,
  teamMembers,
  lineupSuggestion,
  memberFormOptions,
  formOptions,
  coachId,
  headerSubtitle,
}: TeamsWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingCaptainChange, setPendingCaptainChange] = useState<PendingCaptainChange | null>(
    null
  );
  const searchQuery = useAcademyPageSearch();

  const filteredTeamMembers = useMemo(() => {
    if (!searchQuery.trim()) return teamMembers;
    return teamMembers.filter((member) =>
      matchesStateTextSearch(searchQuery, [member.name, member.weight, member.role])
    );
  }, [teamMembers, searchQuery]);

  const filteredOtherTeams = useMemo(() => {
    if (!searchQuery.trim()) return otherTeams;
    return otherTeams.filter((team) =>
      matchesStateTextSearch(searchQuery, [team.name, team.meta])
    );
  }, [otherTeams, searchQuery]);

  useEffect(() => {
    setIsEditing(false);
    setIsAddModalOpen(false);
    setPendingAction(null);
    setActionError(null);
    setPendingCaptainChange(null);
  }, [activeTeam?.id]);

  const currentCaptain = teamMembers.find((member) => member.roleValue === "captain") ?? null;

  const handleTeamSwitch = (teamId: string) => {
    if (teamId === activeTeam?.id) return;
    startTransition(() => {
      router.push(`${pathname}?team=${teamId}`, { scroll: false });
    });
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setActionError(null);
  };

  const handleDoneEdit = () => {
    setIsEditing(false);
    setActionError(null);
  };

  const refreshAfterMutation = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleRemoveMember = async (playerId: string) => {
    if (!activeTeam || pendingAction) return;

    setActionError(null);
    setPendingAction(`remove-${playerId}`);

    try {
      await api.teams.removeMember(academyId, activeTeam.id, playerId);
      refreshAfterMutation();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Could not remove player. Please try again."
      );
    } finally {
      setPendingAction(null);
    }
  };

  const handleSelectionChange = async (
    playerId: string,
    selectionStatus: TeamMemberSelectionStatus
  ) => {
    if (!activeTeam || pendingAction) return;

    setActionError(null);
    setPendingAction(`selection-${playerId}`);

    try {
      await api.teams.updateMember(academyId, activeTeam.id, playerId, { selectionStatus });
      refreshAfterMutation();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Could not update selection. Please try again."
      );
    } finally {
      setPendingAction(null);
    }
  };

  const handleRoleChange = (member: TeamMember, role: TeamMemberRole) => {
    if (!activeTeam || pendingAction || role === member.roleValue) return;

    if (role === "captain") {
      setPendingCaptainChange({ playerId: member.playerId, playerName: member.name });
      return;
    }

    void applyRoleChange(member.playerId, role);
  };

  const applyRoleChange = async (playerId: string, role: TeamMemberRole) => {
    if (!activeTeam || pendingAction) return;

    setActionError(null);
    setPendingAction(`role-${playerId}`);

    try {
      await api.teams.updateMember(academyId, activeTeam.id, playerId, { role });
      refreshAfterMutation();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Could not update role. Please try again."
      );
    } finally {
      setPendingAction(null);
    }
  };

  const tableHeaders = isEditing
    ? ["Member", "Weight (kg)", "Role", "Recent form", "Selection", ""]
    : ["Member", "Weight (kg)", "Role", "Recent form", "Selection"];

  return (
    <SplitLayout>
      <div className={`flex-1 min-w-0 ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
        {coachId ? (
          <CoachTeamsPageHeader
            academyId={academyId}
            coachId={coachId}
            subtitle={headerSubtitle ?? "Squads you coach sync with academy teams."}
            formOptions={formOptions}
          />
        ) : (
          <TeamsPageHeader
            academyId={academyId}
            subtitle={headerSubtitle ?? "Build squads, name captains and pick line-ups for tournaments."}
            formOptions={formOptions}
          />
        )}

        {activeTeam && (
          <div
            className={`relative bg-linear-to-br from-ink to-ink3 text-white rounded-(--radius) shadow-card p-5 mb-4 border-none ${
              isEditing ? "ring-2 ring-brand/55" : ""
            }`}
          >
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  title="Edit this team"
                  aria-label="Edit this team"
                  className="w-8 h-8 rounded-[9px] inline-flex items-center justify-center text-white/80 hover:text-white hover:bg-white/12 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                >
                  <PencilIcon />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pr-10 sm:pr-24">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-[52px] h-[52px] rounded-[14px] bg-white/12 flex items-center justify-center shrink-0">
                  <FlagIcon className="w-[26px] h-[26px] text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[17px] font-bold">{activeTeam.name}</div>
                  <div className="text-[12.5px] text-[#A9B5D1] mt-[3px]">
                    Coach {activeTeam.coach} · created{" "}
                    {new Date(activeTeam.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {activeTeam.memberCount} members
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex -space-x-2 shrink-0">
                {activeTeam.avatars.map((a) => (
                  <div
                    key={a.initials}
                    className="w-[30px] h-[30px] rounded-[9px] border-2 border-ink3 flex items-center justify-center text-[11px] font-bold text-white"
                    style={{ background: a.color }}
                  >
                    {a.initials}
                  </div>
                ))}
                {activeTeam.memberCount > activeTeam.avatars.length && (
                  <div className="w-[30px] h-[30px] rounded-[9px] border-2 border-ink3 flex items-center justify-center text-[11px] font-bold text-white bg-[#7C5CFC]">
                    +{activeTeam.memberCount - activeTeam.avatars.length}
                  </div>
                )}
              </div>
              <div className="sm:text-right sm:border-l sm:border-white/14 sm:pl-[18px] shrink-0">
                <div className="text-[11px] text-[#A9B5D1]">Next fixture</div>
                {activeTeam.nextFixture ? (
                  <>
                    <div className="text-[13px] font-semibold mt-0.5">{activeTeam.nextFixture.title}</div>
                    <div className="text-[11.5px] text-brand mt-px">
                      {new Date(activeTeam.nextFixture.scheduledAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {activeTeam.nextFixture.venue}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[13px] font-semibold mt-0.5 text-white/75">No upcoming fixture</div>
                    <div className="text-[11.5px] text-[#A9B5D1] mt-px">
                      Schedule a match to see details here.
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {!activeTeam ? (
          <EmptyState
            icon={<FlagIcon className="w-5 h-5" />}
            title="No teams yet"
            description="Create a squad to manage members, captains and tournament line-ups."
          />
        ) : teamMembers.length === 0 ? (
          <>
            {isEditing && (
              <div className="flex justify-end gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[10px] py-[11px] px-4 rounded-[10px]"
                >
                  <PlusIcon />
                  Add players
                </button>
                <button
                  type="button"
                  onClick={handleDoneEdit}
                  className="inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-line"
                >
                  Done
                </button>
              </div>
            )}
            <TeamMembersEmptyState
              academyId={academyId}
              teamId={activeTeam.id}
              teamName={activeTeam.name}
              formOptions={memberFormOptions}
            />
          </>
        ) : filteredTeamMembers.length === 0 ? (
          <EmptyState
            compact
            className="w-full min-w-0"
            icon={<FlagIcon className="w-5 h-5" />}
            title="No members match your search"
            description="Try a different search term."
          />
        ) : (
          <>
            {isEditing && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                <p className="text-[12.5px] text-muted">
                  Add or remove players, update roles and selection status for the squad.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px]"
                  >
                    <PlusIcon />
                    Add players
                  </button>
                  <button
                    type="button"
                    onClick={handleDoneEdit}
                    className="inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-line"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {actionError && (
              <p className="text-[13px] font-medium text-red mb-3" role="alert">
                {actionError}
              </p>
            )}

            <AcademyTable headers={tableHeaders} minWidth={isEditing ? 620 : 560}>
              {filteredTeamMembers.map((m) => (
                <TableRow key={m.playerId}>
                  <TableCell>
                    <div className="flex items-center gap-[11px]">
                      <Avatar initials={m.initials} color={m.avatarColor} />
                      <div className="font-semibold text-[13px] text-ink">{m.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{m.weight}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <InlineSelect
                        variant="pill"
                        value={m.roleValue}
                        onChange={(role) => handleRoleChange(m, role as TeamMemberRole)}
                        options={ROLE_OPTIONS}
                        disabled={pendingAction === `role-${m.playerId}`}
                        aria-label={`Role for ${m.name}`}
                      />
                    ) : (
                      <Pill variant={m.roleVariant}>{m.role}</Pill>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex gap-[3px]">
                      {(m.form.length > 0 ? m.form : [null]).map((f, i) => (
                        <FormBadge key={`${m.playerId}-${i}`} result={f} />
                      ))}
                    </span>
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <InlineSelect
                        variant="pill"
                        value={m.selectionStatus}
                        onChange={(selectionStatus) =>
                          handleSelectionChange(m.playerId, selectionStatus as TeamMemberSelectionStatus)
                        }
                        options={SELECTION_OPTIONS}
                        disabled={pendingAction === `selection-${m.playerId}`}
                        aria-label={`Selection status for ${m.name}`}
                      />
                    ) : (
                      <Pill variant={m.selectionVariant}>
                        {m.selectionVariant === "green" && <CheckIcon />}
                        {m.selection}
                      </Pill>
                    )}
                  </TableCell>
                  {isEditing && (
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.playerId)}
                        disabled={pendingAction === `remove-${m.playerId}`}
                        title={`Remove ${m.name} from team`}
                        aria-label={`Remove ${m.name} from team`}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-[8px] text-muted hover:text-red hover:bg-red-soft/60 disabled:opacity-50 transition-colors"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </AcademyTable>
          </>
        )}

        {activeTeam && (
          <>
            <AddTeamMembersModal
              academyId={academyId}
              teamId={activeTeam.id}
              teamName={activeTeam.name}
              open={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              formOptions={memberFormOptions}
            />
            <ChangeCaptainDialog
              academyId={academyId}
              teamId={activeTeam.id}
              playerId={pendingCaptainChange?.playerId ?? null}
              playerName={pendingCaptainChange?.playerName ?? null}
              currentCaptainName={
                currentCaptain && currentCaptain.playerId !== pendingCaptainChange?.playerId
                  ? currentCaptain.name
                  : null
              }
              open={pendingCaptainChange !== null}
              onClose={() => setPendingCaptainChange(null)}
            />
          </>
        )}
      </div>

      <SidePanel className={`flex flex-col gap-3.5 ${isPending ? "opacity-60" : ""}`}>
        <div className="bg-card border border-line rounded-(--radius) shadow-card p-4">
          <SectionTitle title="Other teams" />
          {filteredOtherTeams.length === 0 ? (
            <EmptyState
              compact
              className="border-none shadow-none bg-surface/60 mt-2"
              icon={<FlagIcon className="w-5 h-5" />}
              title={
                searchQuery.trim() && otherTeams.length > 0
                  ? "No teams match your search"
                  : "No other teams"
              }
              description={
                searchQuery.trim() && otherTeams.length > 0
                  ? "Try a different search term."
                  : "Create additional squads for different sports, weight classes or tournaments."
              }
            />
          ) : (
            filteredOtherTeams.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTeamSwitch(t.id)}
                className={`w-full text-left flex gap-[11px] items-center py-2.5 cursor-pointer rounded-[8px] -mx-1 px-1 transition-colors hover:bg-surface/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                  i < filteredOtherTeams.length - 1 ? "border-b border-line2" : ""
                }`}
              >
                <Avatar initials={t.initials} color={t.color} className="rounded-[10px]" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13px]">{t.name}</div>
                  <div className="text-[11.5px] text-muted">{t.meta}</div>
                </div>
              </button>
            ))
          )}
        </div>

        {lineupSuggestion && (
          <div className="bg-brand-soft border border-[#FFD9C5] rounded-(--radius) shadow-card p-4">
            <SectionTitle title="Auto line-up suggestion" />
            <p className="text-[11.5px] text-[#9a5a3a] leading-relaxed mt-1">
              {lineupSuggestion.rationale ?? "Based on recent form & ratings, KhelSetu suggests"}{" "}
              <b className="text-brand-d">{lineupSuggestion.athleteCount} athletes</b> for{" "}
              {lineupSuggestion.title}.
            </p>
            <button
              type="button"
              className="w-full mt-3 inline-flex items-center justify-center bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px]"
            >
              Review suggestion
            </button>
          </div>
        )}
      </SidePanel>
    </SplitLayout>
  );
}
