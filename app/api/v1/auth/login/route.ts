import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { createAuthResponse } from "@/lib/auth/response";
import {
  AuthError,
  InvalidCredentialsError,
  loginWithPassword,
  loginWithPhone,
} from "@/lib/repositories/auth";

export const runtime = "nodejs";

loadEnv();

type LoginBody = {
  mode: "password" | "otp";
  email?: string;
  password?: string;
  phone?: string;
  otp?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginBody;

  try {
    if (body.mode === "password") {
      if (!body.email?.trim() || !body.password?.trim()) {
        return NextResponse.json(
          { error: "Email and password are required." },
          { status: 400 }
        );
      }

      const profile = await loginWithPassword({
        email: body.email,
        password: body.password,
      });

      return createAuthResponse(profile);
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

    return createAuthResponse(profile);
  } catch (error) {
    if (error instanceof InvalidCredentialsError || error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "Could not sign in";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
