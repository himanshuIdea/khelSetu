import { createLogoutResponse } from "@/lib/auth/response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return createLogoutResponse(request.url);
}
