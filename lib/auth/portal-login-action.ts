"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import type { PortalKind } from "@/lib/auth/portal-login";
import { resolvePostAuthRedirectForPortal } from "@/lib/auth/redirect";
import { establishSessionForProfile } from "@/lib/auth/session-cookie";
import {
  AuthError,
  InvalidCredentialsError,
  loginWithIdentifier,
  loginWithPhone,
} from "@/lib/repositories/auth";

export type PortalLoginState = {
  error?: string;
};

function readPortal(value: FormDataEntryValue | null): PortalKind {
  const portal = value?.toString();
  if (
    portal === "player" ||
    portal === "coach" ||
    portal === "staff" ||
    portal === "admin" ||
    portal === "state"
  ) {
    return portal;
  }
  return "admin";
}

export async function portalLoginAction(
  _prev: PortalLoginState,
  formData: FormData
): Promise<PortalLoginState> {
  const portal = readPortal(formData.get("portal"));
  const mode = formData.get("mode")?.toString() === "otp" ? "otp" : "password";
  const next = formData.get("next")?.toString() || null;

  try {
    if (mode === "password") {
      const identifier = formData.get("identifier")?.toString().trim() ?? "";
      const password = formData.get("password")?.toString() ?? "";
      if (!identifier || !password.trim()) {
        return { error: "Username, email, or phone and password are required." };
      }

      const profile = await loginWithIdentifier({ identifier, password });
      await establishSessionForProfile(profile);
      redirect(await resolvePostAuthRedirectForPortal(profile, portal, next));
    }

    const phone = formData.get("phone")?.toString().trim() ?? "";
    const otp = formData.get("otp")?.toString().trim() ?? "";
    if (!phone || !otp) {
      return { error: "Phone number and OTP are required." };
    }

    const profile = await loginWithPhone({ phone, otp });
    await establishSessionForProfile(profile);
    redirect(await resolvePostAuthRedirectForPortal(profile, portal, next));
  } catch (error) {
    unstable_rethrow(error);

    if (error instanceof InvalidCredentialsError || error instanceof AuthError) {
      return { error: error.message };
    }

    return { error: "Something went wrong. Please try again." };
  }
}
