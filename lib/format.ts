const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 100000) {
    return `₹${(rupees / 100000).toFixed(2)}L`;
  }
  return `₹${rupees.toLocaleString("en-IN")}`;
}

export function formatPaiseFull(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  const monthIndex = Number(month) - 1;
  return MONTHS[monthIndex] ?? period;
}

export function formatFeeStatus(status: string, period: string): {
  label: string;
  variant: "green" | "red" | "amber";
} {
  const month = formatPeriod(period);
  if (status === "paid") return { label: `Paid · ${month}`, variant: "green" };
  if (status === "partial") return { label: `Partial · ${month}`, variant: "amber" };
  return { label: `Due · ${month}`, variant: "red" };
}

export function formatAge(dateOfBirth: Date | null): string {
  if (!dateOfBirth) return "—";
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const m = now.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dateOfBirth.getDate())) age--;
  return `${age}y`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function nisLevelLabel(level: string): { badge: "nis-level-1" | "nis-level-2" | "in-review"; label: string } {
  switch (level) {
    case "nis_level_2":
      return { badge: "nis-level-2", label: "NIS Level 2" };
    case "nis_level_1":
      return { badge: "nis-level-1", label: "NIS Level 1" };
    default:
      return { badge: "in-review", label: "In review" };
  }
}
