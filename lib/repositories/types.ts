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
  feesVariant: "green" | "red" | "amber";
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
  coach: string;
  monthlyFee: string;
};

export type TeamMember = {
  initials: string;
  name: string;
  weight: string;
  role: string;
  roleVariant: "brand" | "grey";
  form: string[];
  selection: string;
  selectionVariant: "green" | "amber";
  avatarColor: string;
};

export type OtherTeam = {
  initials: string;
  name: string;
  meta: string;
  color: string;
};

export type AttendanceSession = {
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
  name: string;
  category: string;
  inStock: number;
  issued: number;
  condition: string;
  conditionVariant: "green" | "amber";
  status: string;
  statusVariant: "green" | "red";
  iconBg: string;
  iconColor: string;
};

export type StaffMember = {
  initials: string;
  name: string;
  role: string;
  type: string;
  daysPresent: string;
  salary: string;
  status: string;
  statusVariant: "green" | "amber";
  action: string;
  avatarColor: string;
};
