import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { createAuthResponse } from "@/lib/auth/response";
import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import {
  AuthError,
  changePassword,
  InvalidCredentialsError,
} from "@/lib/repositories/auth";

export const runtime = "nodejs";

loadEnv();

type ChangePasswordBody = {
  currentPassword: string;
  newPassword: string;
};

export async function POST(request: Request) {
  try {
    const userId = await requireSessionUserId();
    const body = (await request.json()) as ChangePasswordBody;

    if (!body.currentPassword?.trim() || !body.newPassword?.trim()) {
      return NextResponse.json(
        { error: "Current and new password are required." },
        { status: 400 }
      );
    }

    const profile = await changePassword({
      userId,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });

    return createAuthResponse(profile);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof InvalidCredentialsError || error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "Could not change password";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
