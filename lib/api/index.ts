import { apiDelete, apiGet, apiPatch, apiPost, apiPostBlob, apiPostFormData, apiPut } from "./http";
import type { AuthAcademy, AuthProfile, PlatformRole } from "@/lib/auth/types";
import type {
  AssignCoachPayload,
  CoachAssignmentGroup,
  UnassignPayload,
  UnassignPreview,
  UpdateCoachAssignmentPayload,
} from "@/lib/coaches";
import type {
  CreateInventoryItemPayload,
  IssueGearPayload,
  OpenGearIssue,
  ReturnGearPayload,
  UpdateInventoryItemPayload,
} from "@/lib/inventory";
import type { CreatePlayerPayload, PlayerEditData, UpdatePlayerPayload } from "@/lib/players";
import type {
  AddTeamMembersPayload,
  CreateTeamPayload,
  UpdateTeamMemberPayload,
  UpdateTeamMemberSelectionPayload,
} from "@/lib/teams";
import type { OnboardingPayload, OnboardingResult } from "@/lib/onboarding";
import type {
  AcademyOnboardingDraftPayload,
  AcademyOnboardingRequestDetail,
  AcademyOnboardingRequestType,
  AcademyOnboardingStatus,
  OnboardingDocumentType,
  OnboardingRequiredAction,
  StateOnboardingRequestListItem,
} from "@/lib/academy-onboarding";
import type {
  AcademyNurseryFlag,
  StateNurseryDetail,
  StateNurseryFilters,
  StateNurseryListItem,
  StateNurserySearchResult,
} from "@/lib/state-nurseries";
import type {
  StateAthleteListItem,
  StateFundsDashboard,
  StateOverviewData,
  StateFundBeneficiaryListResult,
  StateFundSchemeDetail,
  StateFundSchemeHeader,
  StateReportsDashboard,
  StateScoutingProspect,
  VerificationBreakdown,
} from "@/lib/state-portal";
import type {
  ScheduleSettingsPayload,
  SlotPayload,
  TimetableData,
  TimetableSlot,
} from "@/lib/timetable";
import type {
  CreateTournamentPayload,
  EligibleTournamentPlayer,
  InterAcademyOption,
  UpdateTournamentMatchPayload,
  UpdateTournamentMedalsPayload,
} from "@/lib/tournaments";
import type {
  AcademyMeta,
  AttendanceSession,
  Coach,
  InventoryItem,
  GearMovementFeedItem,
  OtherTeam,
  PendingReview,
  Player,
  PlayerDetail,
  PlayerFeeBillingRow,
  StaffMember,
  TeamMember,
} from "@/lib/repositories/types";

export type { AcademyMeta } from "@/lib/repositories/types";
export type { AuthAcademy, AuthProfile, PlatformRole };
export { ApiError } from "./http";

type AuthUserResponse = {
  id: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  fullName: string;
  platformRole: PlatformRole | null;
  phoneVerified: boolean;
  mustChangePassword: boolean;
};

type AuthSessionResponse = {
  user: AuthUserResponse;
  academies: AuthAcademy[];
  needsAcademyOnboarding: boolean;
  requiresNurseryReregistration: boolean;
  onboardingRequest: {
    id: string;
    status: AcademyOnboardingStatus;
    requestType: AcademyOnboardingRequestType;
    requiredActions: string[];
    reviewNotes: string | null;
    submittedAt: string | null;
    reviewedAt: string | null;
    academyId: string | null;
  } | null;
  mustChangePassword?: boolean;
  redirectTo: string;
};

export const api = {
  auth: {
    register: (body: {
      mode: "password" | "otp";
      fullName: string;
      identifier?: string;
      email?: string;
      password?: string;
      phone?: string;
      otp?: string;
    }) => apiPost<AuthSessionResponse>("/auth/register", body),
    login: (body: {
      mode: "password" | "otp";
      identifier?: string;
      email?: string;
      password?: string;
      phone?: string;
      otp?: string;
      portal?: "player" | "coach" | "staff" | "admin" | "state";
      next?: string;
    }) => apiPost<AuthSessionResponse>("/auth/login", body, { timeoutMs: 20_000 }),
    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      apiPost<AuthSessionResponse>("/auth/change-password", body),
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
    nurseryFlag: {
      get: (academyId: string) =>
        apiGet<{ flag: AcademyNurseryFlag | null }>(`/academies/${academyId}/nursery-flag`),
      respond: (
        academyId: string,
        body: { action: "addressed" | "request_review"; note?: string }
      ) =>
        apiPost<{ flag: AcademyNurseryFlag }>(
          `/academies/${academyId}/nursery-flag/respond`,
          body
        ),
    },
  },

  onboarding: {
    getRequest: () =>
      apiGet<{ request: AcademyOnboardingRequestDetail | null }>("/onboarding/request"),
    saveDraft: (payload: AcademyOnboardingDraftPayload) =>
      apiPut<{ request: AcademyOnboardingRequestDetail }>("/onboarding/request", payload),
    submit: () => apiPost<{ request: AcademyOnboardingRequestDetail }>("/onboarding/request/submit", {}),
    uploadDocument: (docType: OnboardingDocumentType, file: File) => {
      const formData = new FormData();
      formData.append("docType", docType);
      formData.append("file", file);
      return apiPostFormData<{
        request: AcademyOnboardingRequestDetail;
        document: { docType: string; objectKey: string; contentType: string };
      }>("/onboarding/documents/upload", formData);
    },
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
    assign: (academyId: string, payload: AssignCoachPayload) =>
      apiPost<{ coachId: string; batchCount: number }>(
        `/academies/${academyId}/coaches/assign`,
        payload
      ),
    listAssignments: (academyId: string, coachId: string) =>
      apiGet<{ assignments: CoachAssignmentGroup[] }>(
        `/academies/${academyId}/coaches/${coachId}/assignments`
      ),
    previewUnassign: (academyId: string, coachId: string, payload: UnassignPayload) => {
      const params = new URLSearchParams({ scope: payload.scope });
      if (payload.sportId) params.set("sportId", payload.sportId);
      if (payload.batchId) params.set("batchId", payload.batchId);
      return apiGet<UnassignPreview>(
        `/academies/${academyId}/coaches/${coachId}/unassign-preview?${params.toString()}`
      );
    },
    updateAssignment: (
      academyId: string,
      coachId: string,
      payload: UpdateCoachAssignmentPayload
    ) =>
      apiPatch<{
        coachId: string;
        sportId: string;
        batchCount: number;
        removedBatchCount: number;
        addedBatchCount: number;
      }>(`/academies/${academyId}/coaches/${coachId}/assignments`, payload),
    unassign: (academyId: string, coachId: string, payload: UnassignPayload) =>
      apiDelete(`/academies/${academyId}/coaches/${coachId}/assignments`, payload),
  },

  timetable: {
    get: (academyId: string) => apiGet<TimetableData>(`/academies/${academyId}/timetable`),
    saveSettings: (academyId: string, payload: ScheduleSettingsPayload) =>
      apiPut<TimetableData>(`/academies/${academyId}/timetable/settings`, payload),
    createSlot: (academyId: string, payload: SlotPayload) =>
      apiPost<{ slot: TimetableSlot }>(`/academies/${academyId}/timetable/slots`, payload),
    updateSlot: (academyId: string, slotId: string, payload: SlotPayload) =>
      apiPatch<{ slot: TimetableSlot }>(
        `/academies/${academyId}/timetable/slots/${slotId}`,
        payload
      ),
    deleteSlot: (academyId: string, slotId: string) =>
      apiDelete(`/academies/${academyId}/timetable/slots/${slotId}`),
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
    getMarkSession: (academyId: string, batchId: string, date: string) =>
      apiGet<import("@/lib/attendance").AttendanceMarkSession>(
        `/academies/${academyId}/attendance/mark?batchId=${encodeURIComponent(batchId)}&date=${encodeURIComponent(date)}`
      ),
    saveMarkSession: (
      academyId: string,
      payload: import("@/lib/attendance").SaveAttendancePayload
    ) => apiPost<{
      sessionId: string;
      present: number;
      absent: number;
      total: number;
      rate: string;
    }>(`/academies/${academyId}/attendance/mark`, payload),
    batchHistory: (academyId: string, batchId: string) =>
      apiGet<import("@/lib/attendance").BatchAttendanceHistoryEntry[]>(
        `/academies/${academyId}/attendance/batches/${encodeURIComponent(batchId)}/history`
      ),
  },

  staffAttendance: {
    getRoster: (academyId: string, date: string) =>
      apiGet<import("@/lib/staff-attendance").StaffAttendanceSession>(
        `/academies/${academyId}/attendance/staff?date=${encodeURIComponent(date)}`
      ),
    save: (
      academyId: string,
      payload: import("@/lib/staff-attendance").SaveStaffAttendancePayload
    ) =>
      apiPost<{ present: number; absent: number; leave: number; total: number }>(
        `/academies/${academyId}/attendance/staff`,
        payload
      ),
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
    create: (academyId: string, body: CreateTournamentPayload) =>
      apiPost<{ id: string; name: string; status: string }>(
        `/academies/${academyId}/tournaments`,
        body
      ),
    eligiblePlayers: (
      academyId: string,
      params: {
        sportId: string;
        ageDivision: string;
        weightClass?: string;
        scope?: string;
        academyIds?: string[];
      }
    ) => {
      const search = new URLSearchParams({
        sportId: params.sportId,
        ageDivision: params.ageDivision,
      });
      if (params.weightClass) search.set("weightClass", params.weightClass);
      if (params.scope) search.set("scope", params.scope);
      if (params.academyIds?.length) search.set("academyIds", params.academyIds.join(","));
      return apiGet<{ players: EligibleTournamentPlayer[]; weightClasses: string[] }>(
        `/academies/${academyId}/tournaments/eligible-players?${search.toString()}`
      );
    },
    interAcademies: (academyId: string) =>
      apiGet<{ academies: InterAcademyOption[] }>(
        `/academies/${academyId}/tournaments/inter-academies`
      ),
    updateMatch: (tournamentId: string, matchId: string, body: UpdateTournamentMatchPayload) =>
      apiPatch<{ match: unknown }>(
        `/tournaments/${tournamentId}/matches/${matchId}`,
        body
      ),
    updateMedals: (tournamentId: string, body: UpdateTournamentMedalsPayload) =>
      apiPatch<{ medals: unknown }>(`/tournaments/${tournamentId}/medals`, body),
    end: (tournamentId: string) =>
      apiPost<{ tournament: { id: string; status: string } }>(
        `/tournaments/${tournamentId}/end`,
        {}
      ),
    moveAthlete: (
      tournamentId: string,
      body: {
        from: { matchId: string; side: "a" | "b" };
        to: { matchId: string; side: "a" | "b" };
      }
    ) => apiPatch<{ ok: boolean }>(`/tournaments/${tournamentId}/matches/move-athlete`, body),
  },

  inventory: {
    stats: (academyId: string) =>
      apiGet<{ value: string; label: string; color?: string }[]>(
        `/academies/${academyId}/inventory/stats`
      ),
    items: (academyId: string) => apiGet<InventoryItem[]>(`/academies/${academyId}/inventory/items`),
    movements: (academyId: string) =>
      apiGet<GearMovementFeedItem[]>(`/academies/${academyId}/inventory/movements`),
    openIssues: (academyId: string) =>
      apiGet<OpenGearIssue[]>(`/academies/${academyId}/inventory/issues`),
    createItem: (academyId: string, body: CreateInventoryItemPayload) =>
      apiPost<InventoryItem>(`/academies/${academyId}/inventory/items`, body),
    updateItem: (academyId: string, itemId: string, body: UpdateInventoryItemPayload) =>
      apiPatch<InventoryItem>(`/academies/${academyId}/inventory/items/${itemId}`, body),
    deleteItem: (academyId: string, itemId: string) =>
      apiDelete(`/academies/${academyId}/inventory/items/${itemId}`),
    issue: (academyId: string, body: IssueGearPayload) =>
      apiPost<OpenGearIssue>(`/academies/${academyId}/inventory/issue`, body),
    returnGear: (academyId: string, body: ReturnGearPayload) =>
      apiPost<{ outstandingQuantity: number }>(`/academies/${academyId}/inventory/return`, body),
  },

  payroll: {
    staff: (academyId: string) => apiGet<StaffMember[]>(`/academies/${academyId}/payroll/staff`),
    getStaff: (academyId: string, staffId: string) =>
      apiGet<{
        id: string;
        fullName: string;
        roleTitle: string;
        employmentType: "full_time" | "part_time";
        monthlySalaryPaise: number;
        isCoach: boolean;
      }>(`/academies/${academyId}/payroll/staff/${staffId}`),
    createStaff: (academyId: string, body: import("@/lib/payroll").CreateStaffPayload) =>
      apiPost<{ id: string }>(`/academies/${academyId}/payroll/staff`, body),
    updateStaff: (
      academyId: string,
      staffId: string,
      body: import("@/lib/payroll").UpdateStaffPayload
    ) => apiPatch<{ id: string }>(`/academies/${academyId}/payroll/staff/${staffId}`, body),
    deleteStaff: (academyId: string, staffId: string) =>
      apiDelete(`/academies/${academyId}/payroll/staff/${staffId}`),
    run: (academyId: string) =>
      apiPost<{ payrollRunId: string; staffCount: number; created: number; updated: number }>(
        `/academies/${academyId}/payroll/run`,
        {}
      ),
    approvePayslip: (
      academyId: string,
      payslipId: string,
      body: import("@/lib/payroll").ApprovePayslipPayload
    ) => apiPatch<{ id: string }>(`/academies/${academyId}/payroll/payslips/${payslipId}`, body),
    bulkApprove: (academyId: string, body: import("@/lib/payroll").BulkApprovePayslipsPayload) =>
      apiPost<{ approved: number; ids: string[] }>(
        `/academies/${academyId}/payroll/payslips/bulk-approve`,
        body
      ),
  },

  fees: {
    billing: (
      academyId: string,
      params?: { sportId?: string; batchId?: string; status?: string }
    ) => {
      const search = new URLSearchParams();
      if (params?.sportId) search.set("sportId", params.sportId);
      if (params?.batchId) search.set("batchId", params.batchId);
      if (params?.status) search.set("status", params.status);
      const query = search.toString();
      return apiGet<PlayerFeeBillingRow[]>(
        `/academies/${academyId}/fees/billing${query ? `?${query}` : ""}`
      );
    },
    recordPayment: (academyId: string, body: import("@/lib/fees").RecordFeePaymentPayload) =>
      apiPost<{ invoiceId: string }>(`/academies/${academyId}/fees/payments`, body),
    generateInvoices: (academyId: string) =>
      apiPost<{ period: string; created: number; skipped: number }>(
        `/academies/${academyId}/fees/invoices/generate`,
        {}
      ),
  },

  credentials: {
    summary: (academyId: string) =>
      apiGet<import("@/lib/repositories/credentials").CredentialSummary>(
        `/academies/${academyId}/credentials/summary`
      ),
    listAthletes: (academyId: string) =>
      apiGet<import("@/lib/repositories/credentials").CredentialRow[]>(
        `/academies/${academyId}/credentials/athletes`
      ),
    listCoaches: (academyId: string) =>
      apiGet<import("@/lib/repositories/credentials").CredentialRow[]>(
        `/academies/${academyId}/credentials/coaches`
      ),
    listStaff: (academyId: string) =>
      apiGet<import("@/lib/repositories/credentials").CredentialRow[]>(
        `/academies/${academyId}/credentials/staff`
      ),
    provision: (academyId: string, role: string, personId: string) =>
      apiPost<{ username: string; temporaryPassword: string }>(
        `/academies/${academyId}/credentials/${role}/${personId}/provision`,
        {}
      ),
    reissue: (academyId: string, role: string, personId: string) =>
      apiPost<{ username: string; temporaryPassword: string }>(
        `/academies/${academyId}/credentials/${role}/${personId}/reissue`,
        {}
      ),
  },

  coach: {
    players: {
      detail: (academyId: string, externalId: string) =>
        apiGet<PlayerDetail>(`/coach/${academyId}/players/${encodeURIComponent(externalId)}`),
    },
    media: {
      upload: (academyId: string, file: File) => {
        const formData = new FormData();
        formData.set("file", file);
        return apiPostFormData<{
          url: string;
          objectKey: string;
          thumbnailGradient: string;
          contentType: string;
        }>(`/coach/${academyId}/media/upload`, formData);
      },
      deleteUpload: (academyId: string, objectKey: string) =>
        apiDelete(
          `/coach/${academyId}/media/upload?objectKey=${encodeURIComponent(objectKey)}`
        ),
      listDrillPosts: (academyId: string) =>
        apiGet<{ posts: import("@/lib/repositories/coach-media").CoachDrillPostItem[] }>(
          `/coach/${academyId}/drill-posts`
        ),
      createDrillPost: (
        academyId: string,
        payload: {
          sportId: string;
          batchId?: string | null;
          drillName: string;
          description?: string | null;
          videoUrl: string;
          thumbnailGradient?: string | null;
          durationSeconds?: number | null;
          publishToAcademy?: boolean;
        }
      ) => apiPost<{ id: string; drillName: string; postedAt: string }>(
        `/coach/${academyId}/drill-posts`,
        payload
      ),
      setDrillPostPublished: (academyId: string, postId: string, published: boolean) =>
        apiPatch<{ ok: true }>(`/coach/${academyId}/drill-posts/${postId}/publish`, { published }),
      listSubmissions: (academyId: string) =>
        apiGet<{ submissions: import("@/lib/repositories/coach-media").CoachMediaSubmission[] }>(
          `/coach/${academyId}/media/submissions`
        ),
      getSubmission: (academyId: string, submissionId: string) =>
        apiGet<import("@/lib/repositories/coach-media").CoachSubmissionDetail>(
          `/coach/${academyId}/media/submissions/${submissionId}`
        ),
      submitReview: (
        academyId: string,
        submissionId: string,
        payload: {
          rating: number;
          notes?: string | null;
          criteriaScores?: { technique?: number; speed?: number; form?: number } | null;
          publishToAcademy?: boolean;
        }
      ) =>
        apiPost<{ ok: true }>(
          `/coach/${academyId}/media/submissions/${submissionId}/review`,
          payload
        ),
      setSubmissionPublished: (academyId: string, submissionId: string, published: boolean) =>
        apiPatch<{ ok: true }>(
          `/coach/${academyId}/media/submissions/${submissionId}/publish`,
          { published }
        ),
    },
  },

  player: {
    media: {
      upload: (academyId: string, file: File) => {
        const formData = new FormData();
        formData.set("file", file);
        return apiPostFormData<{
          url: string;
          objectKey: string;
          thumbnailGradient: string;
          contentType: string;
        }>(`/player/${academyId}/media/upload`, formData);
      },
      deleteUpload: (academyId: string, objectKey: string) =>
        apiDelete(
          `/player/${academyId}/media/upload?objectKey=${encodeURIComponent(objectKey)}`
        ),
      createSubmission: (
        academyId: string,
        payload: {
          drillName: string;
          videoUrl: string;
          drillPostId?: string | null;
          thumbnailGradient?: string | null;
          durationSeconds?: number | null;
        }
      ) =>
        apiPost<{ id: string; drillName: string; submittedAt: string }>(
          `/player/${academyId}/submissions`,
          payload
        ),
    },
    feed: {
      like: (academyId: string, type: string, id: string) =>
        apiPost<{ liked: boolean; likeCount: number }>(
          `/player/${academyId}/feed/${type}/${id}/like`,
          {}
        ),
      unlike: (academyId: string, type: string, id: string) =>
        apiDelete(`/player/${academyId}/feed/${type}/${id}/like`),
      listComments: (academyId: string, type: string, id: string) =>
        apiGet<{ comments: import("@/lib/repositories/academy-feed").FeedComment[] }>(
          `/player/${academyId}/feed/${type}/${id}/comments`
        ),
      addComment: (academyId: string, type: string, id: string, body: string) =>
        apiPost<{ comment: import("@/lib/repositories/academy-feed").FeedComment }>(
          `/player/${academyId}/feed/${type}/${id}/comments`,
          { body }
        ),
    },
    follows: {
      follow: (academyId: string, playerId: string) =>
        apiPost<{ ok: true }>(`/player/${academyId}/follows/${playerId}`, {}),
      unfollow: (academyId: string, playerId: string) =>
        apiDelete(`/player/${academyId}/follows/${playerId}`),
    },
  },

  state: {
    overview: {
      get: () => apiGet<{ data: StateOverviewData }>("/state/overview"),
    },
    nurseries: {
      list: (filters?: StateNurseryFilters) => {
        const search = new URLSearchParams();
        if (filters?.district && filters.district !== "all") {
          search.set("district", filters.district);
        }
        if (filters?.sport && filters.sport !== "all") {
          search.set("sport", filters.sport);
        }
        if (filters?.status && filters.status !== "all") {
          search.set("status", filters.status);
        }
        const query = search.toString();
        return apiGet<{ nurseries: StateNurseryListItem[] }>(
          `/state/nurseries${query ? `?${query}` : ""}`
        );
      },
      search: (q: string) =>
        apiGet<{ results: StateNurserySearchResult[] }>(
          `/state/nurseries/search?q=${encodeURIComponent(q)}`
        ),
      detail: (academyId: string) =>
        apiGet<{ nursery: StateNurseryDetail; registered: boolean }>(
          `/state/nurseries/${academyId}`
        ),
      register: (academyId: string) =>
        apiPost<{ ok: boolean }>("/state/nurseries", { academyId }),
      deregister: (academyId: string) => apiDelete(`/state/nurseries/${academyId}`),
      flag: (academyId: string, body: { note: string; guidelines: string }) =>
        apiPatch<{ nursery: StateNurseryDetail }>(`/state/nurseries/${academyId}`, {
          action: "flag",
          ...body,
        }),
      clearFlag: (academyId: string) =>
        apiPatch<{ nursery: StateNurseryDetail }>(`/state/nurseries/${academyId}`, {
          action: "clear_flag",
        }),
      approve: (academyId: string) =>
        apiPatch<{ nursery: StateNurseryDetail }>(`/state/nurseries/${academyId}`, {
          action: "approve",
        }),
    },
    onboardingRequests: {
      list: (filters?: {
        status?: AcademyOnboardingStatus | "all";
        requestType?: AcademyOnboardingRequestType | "all";
        district?: string;
        days?: number | "all";
      }) => {
        const search = new URLSearchParams();
        if (filters?.status && filters.status !== "all") search.set("status", filters.status);
        if (filters?.requestType && filters.requestType !== "all") {
          search.set("requestType", filters.requestType);
        }
        if (filters?.district && filters.district !== "all") {
          search.set("district", filters.district);
        }
        if (filters?.days && filters.days !== "all") {
          search.set("days", String(filters.days));
        }
        const query = search.toString();
        return apiGet<{ requests: StateOnboardingRequestListItem[] }>(
          `/state/nurseries/requests${query ? `?${query}` : ""}`
        );
      },
      detail: (requestId: string) =>
        apiGet<{ request: AcademyOnboardingRequestDetail }>(
          `/state/nurseries/requests/${requestId}`
        ),
      review: (
        requestId: string,
        body: {
          action: "approve" | "needs_action" | "reject";
          reviewNotes?: string;
          requiredActions?: OnboardingRequiredAction[];
        }
      ) =>
        apiPatch<{ request: AcademyOnboardingRequestDetail }>(
          `/state/nurseries/requests/${requestId}`,
          body
        ),
      documentUrl: (requestId: string, type: OnboardingDocumentType) =>
        `/api/v1/state/nurseries/requests/${requestId}/documents/${type}`,
    },
    scouting: {
      listProspects: (params?: {
        sport?: string;
        district?: string;
        ageGroup?: string;
        minRating?: number;
        search?: string;
        status?: string;
        offset?: number;
        limit?: number;
      }) => {
        const search = new URLSearchParams();
        if (params?.sport && params.sport !== "all") search.set("sport", params.sport);
        if (params?.district && params.district !== "all") search.set("district", params.district);
        if (params?.ageGroup && params.ageGroup !== "all") search.set("ageGroup", params.ageGroup);
        if (params?.status && params.status !== "all") search.set("status", params.status);
        if (params?.minRating != null) search.set("minRating", String(params.minRating));
        if (params?.search?.trim()) search.set("search", params.search.trim());
        if (params?.offset != null) search.set("offset", String(params.offset));
        if (params?.limit != null) search.set("limit", String(params.limit));
        const qs = search.toString();
        return apiGet<{ items: StateScoutingProspect[]; total: number }>(
          `/state/scouting/prospects${qs ? `?${qs}` : ""}`
        );
      },
      updateStatus: (playerId: string, status: string | null) =>
        apiPatch<{ ok: boolean; playerId: string; status: string | null }>(
          `/state/scouting/players/${playerId}`,
          { status }
        ),
      bulkUpdateStatus: (playerIds: string[], status: string) =>
        apiPatch<{ ok: boolean; updated: number; status: string }>(
          "/state/scouting/players/bulk",
          { playerIds, status }
        ),
      downloadShortlistReport: (format: "xlsx" | "pdf") =>
        apiPostBlob("/state/scouting/shortlist-report", { format }),
    },
    funds: {
      dashboard: () => apiGet<{ dashboard: StateFundsDashboard }>("/state/funds"),
      fyMeta: () =>
        apiGet<{ meta: { fiscalYearLabel: string; fyTotalAllocatedPaise: number } }>(
          "/state/funds/fy/meta"
        ),
      updateFyAllocation: (totalAllocatedAmountPaise: number) =>
        apiPatch<{ ok: boolean }>("/state/funds/fy/allocation", {
          totalAllocatedAmountPaise,
        }),
      schemeDetail: (slug: string) =>
        apiGet<{ detail: StateFundSchemeHeader }>(`/state/funds/schemes/${slug}`),
      listBeneficiaries: (
        slug: string,
        params?: {
          district?: string;
          sport?: string;
          grant?: string;
          nursery?: string;
          nis?: string;
          search?: string;
          offset?: number;
          limit?: number;
        }
      ) => {
        const search = new URLSearchParams();
        if (params?.district && params.district !== "all") search.set("district", params.district);
        if (params?.sport && params.sport !== "all") search.set("sport", params.sport);
        if (params?.grant && params.grant !== "all") search.set("grant", params.grant);
        if (params?.nursery && params.nursery !== "all") search.set("nursery", params.nursery);
        if (params?.nis && params.nis !== "all") search.set("nis", params.nis);
        if (params?.search?.trim()) search.set("search", params.search.trim());
        if (params?.offset != null) search.set("offset", String(params.offset));
        if (params?.limit != null) search.set("limit", String(params.limit));
        const qs = search.toString();
        return apiGet<StateFundBeneficiaryListResult>(
          `/state/funds/schemes/${slug}/beneficiaries${qs ? `?${qs}` : ""}`
        );
      },
      updateAllocation: (slug: string, allocatedAmountPaise: number) =>
        apiPatch<{ ok: boolean }>(`/state/funds/schemes/${slug}/allocation`, {
          allocatedAmountPaise,
        }),
      createDisbursement: (
        slug: string,
        body: {
          beneficiaryId: string;
          amountPaise: number;
          status: "pending" | "paid";
          dueDate?: string | null;
          referenceNote?: string;
        }
      ) => apiPost<{ ok: boolean }>(`/state/funds/schemes/${slug}/disbursements`, body),
      releasePending: (schemeSlug?: string, disbursementId?: string) =>
        apiPost<{ ok: boolean; released: number }>("/state/funds/release", {
          schemeSlug,
          disbursementId,
        }),
    },
    athletes: {
      list: (params?: {
        sport?: string;
        district?: string;
        minRating?: number;
        search?: string;
        offset?: number;
        limit?: number;
      }) => {
        const search = new URLSearchParams();
        if (params?.sport && params.sport !== "all") search.set("sport", params.sport);
        if (params?.district && params.district !== "all") search.set("district", params.district);
        if (params?.minRating != null) search.set("minRating", String(params.minRating));
        if (params?.search?.trim()) search.set("search", params.search.trim());
        if (params?.offset != null) search.set("offset", String(params.offset));
        if (params?.limit != null) search.set("limit", String(params.limit));
        const qs = search.toString();
        return apiGet<{ items: StateAthleteListItem[]; total: number }>(
          `/state/athletes${qs ? `?${qs}` : ""}`
        );
      },
      downloadRosterReport: (body: {
        format: "xlsx" | "pdf";
        sport?: string;
        district?: string;
        minRating?: number;
        search?: string;
      }) => apiPostBlob("/state/athletes/roster-report", body),
    },
    reports: {
      dashboard: () => apiGet<{ dashboard: StateReportsDashboard }>("/state/reports/dashboard"),
      generate: (reportType: string, format: "xlsx" | "pdf") =>
        apiPostBlob("/state/reports/generate", { reportType, format }),
    },
    verification: {
      breakdown: () => apiGet<{ breakdown: VerificationBreakdown }>("/state/verification/breakdown"),
    },
  },
};
