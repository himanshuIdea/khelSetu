import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { createAuthResponse } from "@/lib/auth/response";
import {
  AuthError,
  DuplicateAccountError,
  InvalidCredentialsError,
  registerWithIdentifier,
  registerWithPhone,
} from "@/lib/repositories/auth";

export const runtime = "nodejs";

loadEnv();

type RegisterBody = {
  mode: "password" | "otp";
  fullName: string;
  identifier?: string;
  email?: string;
  password?: string;
  phone?: string;
  otp?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterBody;

  if (!body.fullName?.trim()) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }

  try {
    if (body.mode === "password") {
      const identifier = (body.identifier ?? body.email)?.trim();
      if (!identifier || !body.password?.trim()) {
        return NextResponse.json(
          { error: "Username, email, or phone and password are required." },
          { status: 400 }
        );
      }

      const profile = await registerWithIdentifier({
        fullName: body.fullName,
        identifier,
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

    const profile = await registerWithPhone({
      fullName: body.fullName,
      phone: body.phone,
      otp: body.otp,
    });

    return createAuthResponse(profile);
  } catch (error) {
    if (error instanceof DuplicateAccountError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof InvalidCredentialsError || error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "Could not create account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
