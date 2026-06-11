import { NextResponse } from "next/server";
import { validateBrandedLink } from "@/lib/branded-link";
import { loadEnv } from "@/lib/load-env";
import { isSlugAvailable } from "@/lib/repositories/onboarding";

export const runtime = "nodejs";

loadEnv();

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug: rawSlug } = await context.params;
  const slug = decodeURIComponent(rawSlug);

  const validation = validateBrandedLink(slug);
  if (!validation.valid) {
    return NextResponse.json({
      available: false,
      reason: "invalid_format",
      message: validation.message,
    });
  }

  try {
    const available = await isSlugAvailable(slug);
    return NextResponse.json({
      available,
      reason: available ? undefined : "taken",
      message: available ? undefined : "This link is already taken — try another.",
    });
  } catch (error) {
    console.error("[slug/available]", error);
    return NextResponse.json({
      available: false,
      reason: "error",
      message: "Database unavailable. Check DATABASE_URL in .env and run pnpm db:setup.",
    });
  }
}
