export function formatServiceError(error: unknown): { message: string; status: number } {
  const err = error instanceof Error ? error : new Error(String(error));
  const cause = err.cause instanceof Error ? err.cause : err;
  const code = "code" in cause ? String(cause.code) : "";
  const message = cause.message ?? err.message;

  if (code === "ECONNREFUSED" || message.includes("ECONNREFUSED")) {
    return {
      message: "Database connection refused. Check DATABASE_URL in .env.",
      status: 503,
    };
  }

  if (code === "ENOTFOUND" || message.includes("ENOTFOUND")) {
    return {
      message:
        "Database host not found. Copy a fresh connection string from Supabase → Project Settings → Database into DATABASE_URL in .env.",
      status: 503,
    };
  }

  if (message.includes("does not exist") || message.includes("relation")) {
    return {
      message: "Database schema not set up. Run: pnpm db:setup",
      status: 503,
    };
  }

  if (err.message.startsWith("Failed query:")) {
    return {
      message:
        "Database query failed. Ensure DATABASE_URL is correct, then run: pnpm db:setup",
      status: 503,
    };
  }

  return { message: err.message || "Internal server error", status: 500 };
}
