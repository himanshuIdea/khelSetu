import { PortalLandingPage } from "@/components/marketing/PortalLandingPage";
import { redirectIfAuthenticated } from "@/lib/auth/redirect";

export const dynamic = "force-dynamic";

export default async function CoachIndexPage() {
  await redirectIfAuthenticated("coach");
  return <PortalLandingPage portal="coach" />;
}
