import { apiGet, apiPost } from "./http";
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
export { ApiError } from "./http";

export const api = {
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
  },

  coaches: {
    list: (academyId: string) => apiGet<Coach[]>(`/academies/${academyId}/coaches`),
    count: (academyId: string) => apiGet<{ count: number }>(`/academies/${academyId}/coaches/count`),
    pendingReviews: (academyId: string) =>
      apiGet<PendingReview[]>(`/academies/${academyId}/coaches/pending-reviews`),
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
      }>(`/academies/${academyId}/teams/featured`),
    members: (academyId: string, teamId?: string) =>
      apiGet<TeamMember[]>(
        `/academies/${academyId}/teams/members${teamId ? `?teamId=${teamId}` : ""}`
      ),
    others: (academyId: string, excludeTeamId?: string) =>
      apiGet<OtherTeam[]>(
        `/academies/${academyId}/teams${excludeTeamId ? `?excludeTeamId=${excludeTeamId}` : ""}`
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
