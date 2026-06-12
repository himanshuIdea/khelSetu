export class SlugTakenError extends Error {
  constructor() {
    super("This branded link is already taken. Try another.");
    this.name = "SlugTakenError";
  }
}

export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  return code === "23505";
}

export function isConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  return code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ETIMEDOUT";
}
