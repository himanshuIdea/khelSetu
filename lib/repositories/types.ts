export type AcademyMeta = {
  id: string;
  /** Public branded subdomain only — never used in app routes. */
  slug: string;
  initials: string;
  name: string;
  location: string;
  adminInitials: string;
  adminName: string;
  adminRole: string;
};

export type CoachBadge = "nis-level-2" | "nis-level-1" | "in-review";

export type Coach = {
  id: string;
  initials: string;
  name: string;
  role: string;
  badge: CoachBadge;
  badgeLabel: string;
  avatarColor: string;
  players: number;
  rating: number;
  drillsPerWeek: number;
  toReview: number;
};

export type PendingReview = {
  drill: string;
  player: string;
  timeAgo: string;
  thumbnailGradient: string;
};

export type Player = {
  initials: string;
  name: string;
  id: string;
  age: string;
  sport: string;
  weight: string;
  batch: string;
  fees: string;
  feesVariant: "green" | "red" | "amber" | "grey";
  attendance: string;
  status: string;
  statusVariant: "green" | "amber";
  avatarColor: string;
  highlighted?: boolean;
};

export type PlayerDetail = {
  initials: string;
  name: string;
  id: string;
  sport: string;
  rating: string;
  attendance: string;
  boutsWon: string;
  joined: string;
  coach: string | null;
  coachUnassigned: boolean;
  monthlyFee: string;
  batch: string;
  status: string;
  feeStatus: string;
};

export type TeamMemberSelectionStatus = "selected" | "standby" | "not_selected";
export type TeamMemberRole = "captain" | "member";

export type TeamMember = {
  playerId: string;
  initials: string;
  name: string;
  weight: string;
  role: string;
  roleValue: TeamMemberRole;
  roleVariant: "brand" | "grey";
  form: string[];
  selection: string;
  selectionVariant: "green" | "amber" | "grey";
  selectionStatus: TeamMemberSelectionStatus;
  avatarColor: string;
};

export type TeamDetail = {
  id: string;
  name: string;
  coach: string;
  createdAt: Date;
  memberCount: number;
  avatars: { initials: string; color: string }[];
  nextFixture: {
    title: string;
    venue: string;
    scheduledAt: Date;
  } | null;
};

export type OtherTeam = {
  id: string;
  initials: string;
  name: string;
  meta: string;
  color: string;
};

export type AttendanceSession = {
  id: string;
  batchId: string;
  sportId: string;
  date: string;
  batch: string;
  sport: string;
  coach: string;
  time: string;
  present: number;
  total: number;
  rate: string;
  status: string;
  statusVariant: "green" | "amber" | "red";
};

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  inStock: number;
  issued: number;
  lowStockThreshold: number;
  condition: string;
  conditionValue: "good" | "worn" | "damaged";
  conditionVariant: "green" | "amber";
  status: string;
  statusVariant: "green" | "red";
  iconBg: string;
  iconColor: string;
};

export type GearMovementFeedItem = {
  id: string;
  bold: string;
  text: string;
  time: string;
  type: "up" | "check" | "bell";
  prefix?: boolean;
};

export type StaffMember = {
  id: string;
  staffId: string;
  payslipId: string | null;
  isCoach: boolean;
  initials: string;
  name: string;
  role: string;
  type: string;
  employmentType: "full_time" | "part_time";
  daysPresent: string;
  salary: string;
  monthlySalaryPaise: number;
  status: string;
  statusVariant: "green" | "amber" | "grey";
  action: string;
  avatarColor: string;
  canApprove: boolean;
};

export type PlayerFeeBillingRow = {
  id: string;
  playerId: string;
  playerName: string;
  initials: string;
  avatarColor: string;
  sportBatch: string;
  period: string;
  amountPaise: number;
  amountLabel: string;
  status: "paid" | "due" | "partial" | "overdue";
  statusLabel: string;
  statusVariant: "green" | "amber" | "red" | "grey";
  sportId: string;
  batchId: string | null;
};
