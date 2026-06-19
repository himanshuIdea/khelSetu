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
      credentials: "include",
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

async function apiJson<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${resolveApiRoot()}/api/v1${path}`, {
      ...init,
      cache: "no-store",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...init.headers,
      },
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

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiJson<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiJson<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiJson<T>(path, { method: "PUT", body: JSON.stringify(body) });
}

export async function apiDelete(path: string, body?: unknown): Promise<void> {
  await apiJson<void>(path, {
    method: "DELETE",
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

export async function apiPostFormData<T>(path: string, formData: FormData): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${resolveApiRoot()}/api/v1${path}`, {
      method: "POST",
      body: formData,
      cache: "no-store",
      credentials: "include",
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

export async function apiPostBlob(
  path: string,
  body: unknown
): Promise<{ blob: Blob; filename: string }> {
  let response: Response;

  try {
    response = await fetch(`${resolveApiRoot()}/api/v1${path}`, {
      method: "POST",
      body: JSON.stringify(body),
      cache: "no-store",
      credentials: "include",
      headers: { "content-type": "application/json" },
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

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? "shortlist-report";

  return { blob, filename };
}
