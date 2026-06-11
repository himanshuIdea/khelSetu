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

export const academyMeta = {
  initials: "DA",
  name: "Dronacharya Sports Academy",
  location: "Sonipat · Govt-aided",
  adminInitials: "RK",
  adminName: "Rajesh Kadyan",
  adminRole: "Academy Admin",
};

export const dashboardStats = [
  { value: "248", label: "Active players", delta: "+12 this month", iconBg: "var(--brand-soft)", iconColor: "var(--brand-d)", up: true },
  { value: "₹4.82L", label: "Fees collected · June", delta: "86% of target", iconBg: "var(--green-soft)", iconColor: "#0E9B72", up: true },
  { value: "91%", label: "Avg. attendance", delta: "+3% vs May", iconBg: "var(--blue-soft)", iconColor: "#2756D8", up: true },
  { value: "3", label: "Upcoming events", delta: "Next: 12 June", iconBg: "var(--purple-soft)", iconColor: "#6443E0", up: false },
];

export const playersBySport = [
  { sport: "Wrestling", color: "#FF6B2C", count: 96 },
  { sport: "Boxing", color: "#12B886", count: 54 },
  { sport: "Athletics", color: "#2F6BFF", count: 42 },
  { sport: "Kabaddi", color: "#F5A623", count: 36 },
  { sport: "Hockey", color: "#7C5CFC", count: 20 },
];

export const todaySessions = [
  { time: "6:00 AM", title: "Wrestling · Sub-junior", coach: "Coach Naveen Kadyan · Mat 1", pill: "42/45 present", pillVariant: "green" as const },
  { time: "7:30 AM", title: "Boxing · Junior", coach: "Coach Sunita Rani · Ring 2", pill: "28/30 present", pillVariant: "green" as const },
  { time: "4:30 PM", title: "Athletics · Sprints", coach: "Coach Vikram Malik · Track", pill: "Starts in 2h", pillVariant: "amber" as const },
];

export const recentActivity = [
  { bold: "Priya Dahiya", text: "paid June fees — ₹1,500", time: "12 min ago", type: "check" as const },
  { bold: "6 drill videos", text: "Coach Naveen reviewed", time: "1 hour ago", type: "video" as const, prefix: true },
  { bold: "2 new players", text: "enrolled in Kabaddi", time: "3 hours ago", type: "users" as const },
];

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

export const players: Player[] = [
  { initials: "RS", name: "Rohit Sangwan", id: "HRWR-1042", age: "16y", sport: "Wrestling", weight: "65kg", batch: "Sub-junior", fees: "Paid · Jun", feesVariant: "green", attendance: "94%", status: "Active", statusVariant: "green", avatarColor: "#FF6B2C", highlighted: true },
  { initials: "PD", name: "Priya Dahiya", id: "HRBX-0218", age: "15y", sport: "Boxing", weight: "54kg", batch: "Junior", fees: "Paid · Jun", feesVariant: "green", attendance: "97%", status: "Active", statusVariant: "green", avatarColor: "#7C5CFC" },
  { initials: "AP", name: "Aman Phogat", id: "HRWR-1067", age: "14y", sport: "Wrestling", weight: "48kg", batch: "Sub-junior", fees: "Due · ₹1,500", feesVariant: "red", attendance: "88%", status: "Active", statusVariant: "green", avatarColor: "#2F6BFF" },
  { initials: "SM", name: "Sahil Malik", id: "HRAT-0091", age: "17y", sport: "Athletics", weight: "400m", batch: "Senior", fees: "Paid · Jun", feesVariant: "green", attendance: "91%", status: "Active", statusVariant: "green", avatarColor: "#12B886" },
  { initials: "NK", name: "Neha Kadyan", id: "HRKB-0153", age: "16y", sport: "Kabaddi", weight: "Raider", batch: "Junior", fees: "Paid · Jun", feesVariant: "green", attendance: "85%", status: "On hold", statusVariant: "amber", avatarColor: "#F5A623" },
  { initials: "VS", name: "Vikas Sheoran", id: "HRWR-1088", age: "15y", sport: "Wrestling", weight: "57kg", batch: "Sub-junior", fees: "Paid · Jun", feesVariant: "green", attendance: "96%", status: "Active", statusVariant: "green", avatarColor: "#E11D48" },
  { initials: "MR", name: "Manju Rani", id: "HRBX-0240", age: "16y", sport: "Boxing", weight: "60kg", batch: "Junior", fees: "Due · ₹1,200", feesVariant: "amber", attendance: "90%", status: "Active", statusVariant: "green", avatarColor: "#0E9B72" },
];

export const selectedPlayer = {
  initials: "RS",
  name: "Rohit Sangwan",
  id: "HRWR-1042",
  sport: "Wrestling · 65kg",
  rating: "7.8",
  attendance: "94%",
  boutsWon: "12",
  joined: "14 Apr 2024",
  coach: "Naveen Kadyan",
  monthlyFee: "₹1,500",
};

export const coaches: Coach[] = [
  { initials: "NK", name: "Naveen Kadyan", role: "Wrestling · Head Coach", badge: "nis-level-2", badgeLabel: "NIS Level 2", avatarColor: "#FF6B2C", players: 48, rating: 4.8, drillsPerWeek: 4, toReview: 6 },
  { initials: "SR", name: "Sunita Rani", role: "Boxing · Senior Coach", badge: "nis-level-1", badgeLabel: "NIS Level 1", avatarColor: "#7C5CFC", players: 36, rating: 4.7, drillsPerWeek: 3, toReview: 4 },
  { initials: "VM", name: "Vikram Malik", role: "Athletics · Coach", badge: "nis-level-1", badgeLabel: "NIS Level 1", avatarColor: "#2F6BFF", players: 42, rating: 4.6, drillsPerWeek: 5, toReview: 2 },
  { initials: "JS", name: "Jagdeep Singh", role: "Kabaddi · Coach", badge: "in-review", badgeLabel: "In review", avatarColor: "#12B886", players: 36, rating: 4.5, drillsPerWeek: 2, toReview: 3 },
];

export const pendingReviews: PendingReview[] = [
  { drill: "Single-leg takedown", player: "Rohit Sangwan", timeAgo: "2h ago", thumbnailGradient: "linear-gradient(135deg, #0E1B33, #1E335C)" },
  { drill: "Jab–cross combo", player: "Priya Dahiya", timeAgo: "3h ago", thumbnailGradient: "linear-gradient(135deg, #7C5CFC, #A78BFA)" },
  { drill: "Block starts", player: "Sahil Malik", timeAgo: "5h ago", thumbnailGradient: "linear-gradient(135deg, #2F6BFF, #5B8DEF)" },
];

export const teamMembers = [
  { initials: "RS", name: "Rohit Sangwan", weight: "65 kg", role: "Captain", roleVariant: "brand" as const, form: ["W", "W", "L", "W"], selection: "Selected", selectionVariant: "green" as const, avatarColor: "#FF6B2C" },
  { initials: "AP", name: "Aman Phogat", weight: "48 kg", role: "Member", roleVariant: "grey" as const, form: ["W", "W", "W", "W"], selection: "Selected", selectionVariant: "green" as const, avatarColor: "#2F6BFF" },
  { initials: "VS", name: "Vikas Sheoran", weight: "57 kg", role: "Member", roleVariant: "grey" as const, form: ["W", "L", "W", "W"], selection: "Standby", selectionVariant: "amber" as const, avatarColor: "#E11D48" },
  { initials: "DK", name: "Deepak Kundu", weight: "52 kg", role: "Member", roleVariant: "grey" as const, form: ["L", "W", "W", "L"], selection: "Selected", selectionVariant: "green" as const, avatarColor: "#12B886" },
];

export const otherTeams = [
  { initials: "BX", name: "Junior Boxing Team", meta: "Coach Sunita · 12 members", color: "#7C5CFC" },
  { initials: "KB", name: "Kabaddi Senior Squad", meta: "Coach Jagdeep · 10 members", color: "#F5A623" },
  { initials: "AT", name: "Relay 4×100m", meta: "Coach Vikram · 6 members", color: "#2F6BFF" },
];

export const matSchedule = [
  { mat: "Mat 1 · Live", time: "2:30 PM", bout: "SF · Sangwan vs Hooda", variant: "red" as const },
  { mat: "Mat 2 · Next", time: "3:00 PM", bout: "SF · Malik vs Kadyan", variant: "grey" as const },
  { mat: "Mat 1 · Final", time: "4:00 PM", bout: "65 kg Gold bout", variant: "amber" as const },
];

export const inventoryStats = [
  { value: "1,284", label: "Total items" },
  { value: "412", label: "Currently issued" },
  { value: "7", label: "Low stock", color: "var(--red)" },
  { value: "18", label: "Due for return", color: "var(--amber)" },
];

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

export const inventoryItems: InventoryItem[] = [
  { name: "Wrestling singlets", category: "Wrestling", inStock: 64, issued: 96, condition: "Good", conditionVariant: "green", status: "In stock", statusVariant: "green", iconBg: "var(--brand-soft)", iconColor: "var(--brand-d)" },
  { name: "Boxing gloves · 12oz", category: "Boxing", inStock: 8, issued: 46, condition: "Worn", conditionVariant: "amber", status: "Low stock", statusVariant: "red", iconBg: "var(--purple-soft)", iconColor: "#6443E0" },
  { name: "Track spikes", category: "Athletics", inStock: 31, issued: 40, condition: "Good", conditionVariant: "green", status: "In stock", statusVariant: "green", iconBg: "var(--blue-soft)", iconColor: "#2756D8" },
  { name: "Kabaddi mats (section)", category: "Kabaddi", inStock: 12, issued: 0, condition: "Good", conditionVariant: "green", status: "In stock", statusVariant: "green", iconBg: "var(--amber-soft)", iconColor: "#C77F12" },
  { name: "Head guards", category: "Boxing", inStock: 3, issued: 28, condition: "Worn", conditionVariant: "amber", status: "Low stock", statusVariant: "red", iconBg: "var(--green-soft)", iconColor: "#0E9B72" },
  { name: "Training cones (set)", category: "Common", inStock: 22, issued: 6, condition: "Good", conditionVariant: "green", status: "In stock", statusVariant: "green", iconBg: "#EAF0FF", iconColor: "#2756D8" },
  { name: "Skipping ropes", category: "Common", inStock: 40, issued: 52, condition: "Good", conditionVariant: "green", status: "In stock", statusVariant: "green", iconBg: "#FDECEC", iconColor: "#D63B3B" },
];

export const gearMovements = [
  { bold: "2× singlets", text: "issued to R. Sangwan", time: "25 min ago", type: "up" as const },
  { bold: "Head guard", text: "returned by M. Rani", time: "2 hours ago", type: "check" as const },
  { bold: "Boxing gloves", text: "Reorder alert:", time: "Today", type: "bell" as const, prefix: true },
];

export const payrollStats = [
  { value: "22", label: "Total staff", iconBg: "var(--brand-soft)", iconColor: "var(--brand-d)", icon: "users" as const },
  { value: "₹6.40L", label: "Payroll · this month", iconBg: "var(--green-soft)", iconColor: "#0E9B72", icon: "cash" as const },
  { value: "9", label: "Coaches", iconBg: "var(--blue-soft)", iconColor: "#2756D8", icon: "cap" as const },
  { value: "2", label: "Pending approval", iconBg: "var(--amber-soft)", iconColor: "#C77F12", icon: "clock" as const },
];

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

export const staffMembers: StaffMember[] = [
  { initials: "NK", name: "Naveen Kadyan", role: "Head Coach · Wrestling", type: "Full-time", daysPresent: "26 / 26", salary: "₹55,000", status: "Paid", statusVariant: "green", action: "Payslip", avatarColor: "#FF6B2C" },
  { initials: "SR", name: "Sunita Rani", role: "Senior Coach · Boxing", type: "Full-time", daysPresent: "25 / 26", salary: "₹42,000", status: "Paid", statusVariant: "green", action: "Payslip", avatarColor: "#7C5CFC" },
  { initials: "VM", name: "Vikram Malik", role: "Coach · Athletics", type: "Full-time", daysPresent: "26 / 26", salary: "₹38,000", status: "Paid", statusVariant: "green", action: "Payslip", avatarColor: "#2F6BFF" },
  { initials: "RP", name: "Dr. Ritu Phogat", role: "Physiotherapist", type: "Part-time", daysPresent: "14 / 16", salary: "₹28,000", status: "Pending", statusVariant: "amber", action: "Review", avatarColor: "#12B886" },
  { initials: "OP", name: "Om Prakash", role: "Groundskeeper", type: "Full-time", daysPresent: "26 / 26", salary: "₹18,000", status: "Paid", statusVariant: "green", action: "Payslip", avatarColor: "#F5A623" },
  { initials: "SA", name: "Sarita Antil", role: "Accountant", type: "Full-time", daysPresent: "24 / 26", salary: "₹32,000", status: "Paid", statusVariant: "green", action: "Payslip", avatarColor: "#E11D48" },
  { initials: "RS", name: "Ramesh Saini", role: "Security", type: "Full-time", daysPresent: "26 / 26", salary: "₹16,000", status: "Pending", statusVariant: "amber", action: "Review", avatarColor: "#0E9B72" },
];

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

export const attendanceSessions: AttendanceSession[] = [
  { batch: "Sub-junior", sport: "Wrestling", coach: "Naveen Kadyan", time: "6:00 AM", present: 42, total: 45, rate: "93%", status: "Marked", statusVariant: "green" },
  { batch: "Junior", sport: "Boxing", coach: "Sunita Rani", time: "7:30 AM", present: 28, total: 30, rate: "93%", status: "Marked", statusVariant: "green" },
  { batch: "Senior", sport: "Athletics", coach: "Vikram Malik", time: "4:30 PM", present: 0, total: 38, rate: "—", status: "Upcoming", statusVariant: "amber" },
  { batch: "Junior", sport: "Kabaddi", coach: "Jagdeep Singh", time: "5:00 PM", present: 0, total: 36, rate: "—", status: "Upcoming", statusVariant: "amber" },
  { batch: "Sub-junior", sport: "Wrestling", coach: "Naveen Kadyan", time: "Yesterday", present: 44, total: 45, rate: "98%", status: "Marked", statusVariant: "green" },
  { batch: "Junior", sport: "Boxing", coach: "Sunita Rani", time: "Yesterday", present: 27, total: 30, rate: "90%", status: "Marked", statusVariant: "green" },
  { batch: "Senior", sport: "Athletics", coach: "Vikram Malik", time: "Yesterday", present: 34, total: 38, rate: "89%", status: "Low", statusVariant: "red" },
];
