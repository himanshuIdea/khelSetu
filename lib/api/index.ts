import { apiDelete, apiGet, apiPatch, apiPost } from "./http";
import type { AuthAcademy, AuthProfile, PlatformRole } from "@/lib/auth/types";
import type { CreateCoachPayload } from "@/lib/coaches";
import type { CreatePlayerPayload, PlayerEditData, UpdatePlayerPayload } from "@/lib/players";
import type {
  AddTeamMembersPayload,
  CreateTeamPayload,
  UpdateTeamMemberPayload,
  UpdateTeamMemberSelectionPayload,
} from "@/lib/teams";
import type { OnboardingPayload, OnboardingResult } from "@/lib/onboarding";
import type {
  AcademyMeta,
  AttendanceSession,
  Coach,
  InventoryItem,
  OtherTeam,
  PendingReview,
  Player,
  PlayerDetail,
  StaffMember,
  TeamMember,
} from "@/lib/repositories/types";

export type { AcademyMeta } from "@/lib/repositories/types";
export type { AuthAcademy, AuthProfile, PlatformRole };
export { ApiError } from "./http";

type AuthUserResponse = {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  platformRole: PlatformRole | null;
  phoneVerified: boolean;
};

type AuthSessionResponse = {
  user: AuthUserResponse;
  academies: AuthAcademy[];
  needsAcademyOnboarding: boolean;
  redirectTo: string;
};

export const api = {
  auth: {
    register: (body: {
      mode: "password" | "otp";
      fullName: string;
      email?: string;
      password?: string;
      phone?: string;
      otp?: string;
    }) => apiPost<AuthSessionResponse>("/auth/register", body),
    login: (body: {
      mode: "password" | "otp";
      email?: string;
      password?: string;
      phone?: string;
      otp?: string;
    }) => apiPost<AuthSessionResponse>("/auth/login", body),
    me: () => apiGet<AuthSessionResponse>("/auth/me"),
    logout: () => apiPost<{ ok: boolean }>("/auth/logout", {}),
  },

  academy: {
    getMeta: (academyId: string) => apiGet<AcademyMeta>(`/academies/${academyId}/meta`),
    checkSlug: (slug: string) =>
      apiGet<{ available: boolean; reason?: string; message?: string }>(
        `/academies/slug/${encodeURIComponent(slug)}/available`
      ),
    create: (payload: OnboardingPayload) =>
      apiPost<OnboardingResult>("/academies/onboarding", payload),
  },

  players: {
    list: (academyId: string) => apiGet<Player[]>(`/academies/${academyId}/players`),
    counts: (academyId: string) =>
      apiGet<{ active: number; onHold: number }>(`/academies/${academyId}/players/counts`),
    detail: (academyId: string, externalId: string) =>
      apiGet<PlayerDetail>(`/academies/${academyId}/players/${externalId}`),
    create: (academyId: string, payload: CreatePlayerPayload) =>
      apiPost<{ id: string; externalId: string }>(
        `/academies/${academyId}/players`,
        payload
      ),
    getForEdit: (academyId: string, externalId: string) =>
      apiGet<PlayerEditData>(
        `/academies/${academyId}/players/${externalId}?for=edit`
      ),
    update: (academyId: string, externalId: string, payload: UpdatePlayerPayload) =>
      apiPatch<{ id: string; externalId: string }>(
        `/academies/${academyId}/players/${externalId}`,
        payload
      ),
    remove: (academyId: string, externalId: string) =>
      apiDelete(`/academies/${academyId}/players/${externalId}`),
  },

  coaches: {
    list: (academyId: string) => apiGet<Coach[]>(`/academies/${academyId}/coaches`),
    count: (academyId: string) => apiGet<{ count: number }>(`/academies/${academyId}/coaches/count`),
    pendingReviews: (academyId: string) =>
      apiGet<PendingReview[]>(`/academies/${academyId}/coaches/pending-reviews`),
    create: (academyId: string, payload: CreateCoachPayload) =>
      apiPost<{ id: string }>(`/academies/${academyId}/coaches`, payload),
  },

  dashboard: {
    stats: (academyId: string) =>
      apiGet<
        {
          value: string;
          label: string;
          delta: string;
          iconBg: string;
          iconColor: string;
          up: boolean;
        }[]
      >(`/academies/${academyId}/dashboard/stats`),
    playersBySport: (academyId: string) =>
      apiGet<{ sport: string; color: string; count: number }[]>(
        `/academies/${academyId}/dashboard/players-by-sport`
      ),
    todaySessions: (academyId: string) =>
      apiGet<
        {
          time: string;
          title: string;
          coach: string;
          pill: string;
          pillVariant: "green" | "amber";
        }[]
      >(`/academies/${academyId}/dashboard/today-sessions`),
    activity: (academyId: string) =>
      apiGet<
        {
          bold: string;
          text: string;
          time: string;
          type: "check" | "video" | "users";
          prefix?: boolean;
        }[]
      >(`/academies/${academyId}/dashboard/activity`),
  },

  attendance: {
    sessions: (academyId: string) =>
      apiGet<AttendanceSession[]>(`/academies/${academyId}/attendance/sessions`),
  },

  teams: {
    featured: (academyId: string) =>
      apiGet<{
        id: string;
        name: string;
        coach: string;
        createdAt: string;
        memberCount: number;
        avatars: { initials: string; color: string }[];
        nextFixture: {
          title: string;
          venue: string;
          scheduledAt: string;
        } | null;
      }>(`/academies/${academyId}/teams/featured`),
    lineupSuggestion: (academyId: string, teamId?: string) =>
      apiGet<{
        title: string;
        athleteCount: number;
        rationale: string | null;
        athletes: string[];
      } | null>(
        `/academies/${academyId}/teams/lineup-suggestion${teamId ? `?teamId=${teamId}` : ""}`
      ),
    members: (academyId: string, teamId?: string) =>
      apiGet<TeamMember[]>(
        `/academies/${academyId}/teams/members${teamId ? `?teamId=${teamId}` : ""}`
      ),
    others: (academyId: string, excludeTeamId?: string) =>
      apiGet<OtherTeam[]>(
        `/academies/${academyId}/teams${excludeTeamId ? `?excludeTeamId=${excludeTeamId}` : ""}`
      ),
    create: (academyId: string, payload: CreateTeamPayload) =>
      apiPost<{ id: string; name: string }>(`/academies/${academyId}/teams`, payload),
    addMembers: (academyId: string, teamId: string, payload: AddTeamMembersPayload) =>
      apiPost<{ added: number }>(`/academies/${academyId}/teams/${teamId}/members`, payload),
    removeMember: (academyId: string, teamId: string, playerId: string) =>
      apiDelete(`/academies/${academyId}/teams/${teamId}/members/${playerId}`),
    updateMember: (
      academyId: string,
      teamId: string,
      playerId: string,
      payload: UpdateTeamMemberPayload
    ) =>
      apiPatch<{ selectionStatus?: string; role?: string }>(
        `/academies/${academyId}/teams/${teamId}/members/${playerId}`,
        payload
      ),
    updateMemberSelection: (
      academyId: string,
      teamId: string,
      playerId: string,
      payload: UpdateTeamMemberSelectionPayload
    ) =>
      apiPatch<{ selectionStatus?: string; role?: string }>(
        `/academies/${academyId}/teams/${teamId}/members/${playerId}`,
        payload
      ),
  },

  tournaments: {
    active: (academyId: string) =>
      apiGet<{
        name: string;
        location: string;
        startDate: string;
        endDate: string;
        participantAcademies: number;
        participantAthletes: number;
        weightClass: string;
        status: string;
      } | null>(`/academies/${academyId}/tournaments/active`),
    activeId: (academyId: string) =>
      apiGet<{ id: string | null }>(`/academies/${academyId}/tournaments/active/id`),
    bracket: (tournamentId: string) =>
      apiGet<
        {
          id: string;
          round: string;
          bracketPosition: number;
          playerAName: string | null;
          playerBName: string | null;
          scoreA: number | null;
          scoreB: number | null;
          status: string;
          matLabel: string | null;
        }[]
      >(`/tournaments/${tournamentId}/bracket`),
    matSchedule: (tournamentId: string) =>
      apiGet<
        {
          mat: string;
          time: string;
          bout: string;
          variant: "red" | "grey" | "amber";
        }[]
      >(`/tournaments/${tournamentId}/mat-schedule`),
    medals: (tournamentId: string, academyId: string) =>
      apiGet<{ gold: number; silver: number; bronze: number }>(
        `/tournaments/${tournamentId}/medals?academyId=${academyId}`
      ),
  },

  inventory: {
    stats: (academyId: string) =>
      apiGet<{ value: string; label: string; color?: string }[]>(
        `/academies/${academyId}/inventory/stats`
      ),
    items: (academyId: string) => apiGet<InventoryItem[]>(`/academies/${academyId}/inventory/items`),
    movements: (academyId: string) =>
      apiGet<
        {
          bold: string;
          text: string;
          time: string;
          type: "up" | "check" | "bell";
          prefix?: boolean;
        }[]
      >(`/academies/${academyId}/inventory/movements`),
  },

  payroll: {
    stats: (academyId: string) =>
      apiGet<
        {
          value: string;
          label: string;
          iconBg: string;
          iconColor: string;
          icon: "users" | "cash" | "cap" | "clock";
        }[]
      >(`/academies/${academyId}/payroll/stats`),
    staff: (academyId: string) => apiGet<StaffMember[]>(`/academies/${academyId}/payroll/staff`),
  },
};
