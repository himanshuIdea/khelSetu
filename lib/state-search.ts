export function normalizeStateSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function matchesStateTextSearch(
  query: string,
  fields: ReadonlyArray<string | null | undefined>
): boolean {
  const normalized = normalizeStateSearchQuery(query);
  if (!normalized) return true;

  return fields.some((field) => {
    const value = field?.trim().toLowerCase();
    return value ? value.includes(normalized) : false;
  });
}
