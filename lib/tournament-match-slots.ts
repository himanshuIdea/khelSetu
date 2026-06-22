const PLACEHOLDER_PREFIXES = [
  "Winner ",
  "Loser ",
  "Top Pool ",
  "Winners bracket",
  "Losers bracket",
] as const;

export function isPlaceholderAthleteName(name: string | null | undefined): boolean {
  if (!name?.trim()) return true;
  const trimmed = name.trim();
  if (trimmed === "TBD" || trimmed === "BYE") return true;
  return PLACEHOLDER_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

export function isOpenAthleteSlot(
  playerId: string | null | undefined,
  playerName: string | null | undefined
): boolean {
  if (playerId) return false;
  return isPlaceholderAthleteName(playerName);
}

export function isDraggableAthlete(
  playerId: string | null | undefined,
  playerName: string | null | undefined,
  matchCompleted: boolean
): boolean {
  if (matchCompleted) return false;
  if (playerId) return true;
  if (!playerName?.trim()) return false;
  return !isPlaceholderAthleteName(playerName);
}
