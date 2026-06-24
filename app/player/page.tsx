import { PortalLandingPage } from "@/components/marketing/PortalLandingPage";
import { redirectIfAuthenticated } from "@/lib/auth/redirect";

export const dynamic = "force-dynamic";

export default async function PlayerIndex() {
  await redirectIfAuthenticated("player");
  return <PortalLandingPage portal="player" />;
}
