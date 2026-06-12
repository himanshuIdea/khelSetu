import { createLogoutResponse } from "@/lib/auth/response";

export const runtime = "nodejs";

export async function POST() {
  return createLogoutResponse();
}
