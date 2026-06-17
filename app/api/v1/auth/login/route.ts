import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { createAuthResponse } from "@/lib/auth/response";
import {
  AuthError,
  InvalidCredentialsError,
  loginWithIdentifier,
  loginWithPhone,
} from "@/lib/repositories/auth";

export const runtime = "nodejs";

loadEnv();

import type { PortalKind } from "@/lib/auth/portal-login";

type LoginBody = {
  mode: "password" | "otp";
  identifier?: string;
  email?: string;
  password?: string;
  phone?: string;
  otp?: string;
  portal?: PortalKind;
  next?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginBody;
  const authOptions = {
    portal: body.portal,
    next: body.next,
  };

  try {
    if (body.mode === "password") {
      const identifier = (body.identifier ?? body.email)?.trim();
      if (!identifier || !body.password?.trim()) {
        return NextResponse.json(
          { error: "Username, email, or phone and password are required." },
          { status: 400 }
        );
      }

      const profile = await loginWithIdentifier({
        identifier,
        password: body.password,
      });

      return createAuthResponse(profile, authOptions);
    }

    if (!body.phone?.trim() || !body.otp?.trim()) {
      return NextResponse.json(
        { error: "Phone number and OTP are required." },
        { status: 400 }
      );
    }

    const profile = await loginWithPhone({
      phone: body.phone,
      otp: body.otp,
    });

    return createAuthResponse(profile, authOptions);
  } catch (error) {
    if (error instanceof InvalidCredentialsError || error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "Could not sign in";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
