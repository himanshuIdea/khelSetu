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

export function resolvePlayerFeeDisplay(
  invoice:
    | {
        status: string;
        period: string;
        amountPaise: number;
      }
    | undefined,
  monthlyFeePaise: number | null | undefined
): { label: string; variant: "green" | "red" | "amber" | "grey" } {
  if (invoice) {
    if (invoice.status === "due") {
      return { label: `Due · ${formatPaiseFull(invoice.amountPaise)}`, variant: "red" };
    }
    if (invoice.status === "partial") {
      return { label: `Due · ${formatPaiseFull(invoice.amountPaise)}`, variant: "amber" };
    }
    return formatFeeStatus(invoice.status, invoice.period);
  }

  if (monthlyFeePaise != null && monthlyFeePaise > 0) {
    return formatFeeStatus("paid", currentFeePeriod());
  }

  return { label: "Not set", variant: "grey" };
}

export function currentFeePeriod(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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

/** Display weight with kg unit. Non-numeric categories (e.g. Raider, 400m) are left unchanged. */
export function formatWeightKg(value: string | number | null | undefined): string {
  if (value == null || value === "" || value === "—") return "—";
  const str = String(value).trim();
  if (/kgs?/i.test(str)) {
    return str.replace(/^(\d+(?:\.\d+)?)\s*kgs?\s*$/i, "$1 kg");
  }
  if (/^\d+(?:\.\d+)?$/.test(str)) {
    return `${str} kg`;
  }
  return str;
}

/** Formats the weight segment in "Sport · weight" display lines. */
export function formatSportWeightLine(line: string): string {
  if (!line || line === "—") return line;
  const sep = " · ";
  const idx = line.lastIndexOf(sep);
  if (idx === -1) return line;
  const sport = line.slice(0, idx);
  const weight = line.slice(idx + sep.length);
  return `${sport}${sep}${formatWeightKg(weight)}`;
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

export function formatVideoDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) {
    return "0:00";
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
