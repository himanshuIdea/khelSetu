export const ACADEMY_BATCH_NAMES = ["Sub-junior", "Junior", "Senior"] as const;

export type AcademyBatchName = (typeof ACADEMY_BATCH_NAMES)[number];

const BATCH_LABELS: Record<AcademyBatchName, string> = {
  "Sub-junior": "Sub-junior (U-15)",
  Junior: "Junior (U-18)",
  Senior: "Senior",
};

const BATCH_ORDER: Record<AcademyBatchName, number> = {
  "Sub-junior": 0,
  Junior: 1,
  Senior: 2,
};

export function isAcademyBatchName(name: string): name is AcademyBatchName {
  return ACADEMY_BATCH_NAMES.includes(name as AcademyBatchName);
}

export function getBatchLabel(name: string): string {
  if (isAcademyBatchName(name)) return BATCH_LABELS[name];
  return name;
}

export function sortBatchNames<T extends string>(names: T[]): T[] {
  return [...names].sort((a, b) => {
    const aOrder = isAcademyBatchName(a) ? BATCH_ORDER[a] : 99;
    const bOrder = isAcademyBatchName(b) ? BATCH_ORDER[b] : 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.localeCompare(b);
  });
}

export function sortBatchesByName<T extends { name: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aOrder = isAcademyBatchName(a.name) ? BATCH_ORDER[a.name] : 99;
    const bOrder = isAcademyBatchName(b.name) ? BATCH_ORDER[b.name] : 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.name.localeCompare(b.name);
  });
}

/** One batch per sport + canonical name (guards against duplicate DB rows). */
export function dedupeFormBatches<T extends { id: string; name: string; sportId: string }>(
  rows: T[]
): T[] {
  const byKey = new Map<string, T>();
  for (const row of rows) {
    const key = `${row.sportId}:${row.name}`;
    if (!byKey.has(key)) byKey.set(key, row);
  }
  return sortBatchesByName([...byKey.values()]);
}

function getAgeOnDate(dateOfBirth: Date, onDate = new Date()): number {
  let age = onDate.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = onDate.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && onDate.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }
  return age;
}

/** Suggests a batch from date of birth using academy age brackets. */
export function inferBatchFromDateOfBirth(
  dateOfBirth: string | Date,
  onDate = new Date()
): AcademyBatchName | null {
  const dob = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  if (Number.isNaN(dob.getTime())) return null;

  const age = getAgeOnDate(dob, onDate);
  if (age < 15) return "Sub-junior";
  if (age < 18) return "Junior";
  return "Senior";
}
