import { redirect } from "next/navigation";
import { LandingPage } from "@/components/marketing/LandingPage";
import { resolvePostAuthRedirect } from "@/lib/auth/redirect";
import { getSessionTokenPayload } from "@/lib/auth/server";
import { getAuthProfile } from "@/lib/repositories/auth";

export default async function Home() {
  const session = await getSessionTokenPayload();
  if (session?.sub) {
    const profile = await getAuthProfile(session.sub);
    if (profile) {
      redirect(resolvePostAuthRedirect(profile));
    }
  }

  return <LandingPage />;
}
