import { gatewayUrl } from "@/services/shared/config";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Browser calls same-origin Next.js routes; server components call the gateway. */
function resolveApiRoot(): string {
  if (typeof window !== "undefined") return "";
  return gatewayUrl;
}

export async function apiGet<T>(path: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${resolveApiRoot()}/api/v1${path}`, {
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Cannot reach the API. Check your connection and try again.",
      503
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(body.error ?? `API error ${response.status}`, response.status);
  }

  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${resolveApiRoot()}/api/v1${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Cannot reach the API. Check your connection and try again.",
      503
    );
  }

  if (!response.ok) {
    const parsed = (await response.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(parsed.error ?? `API error ${response.status}`, response.status);
  }

  return response.json() as Promise<T>;
}
