import { StateLandingPage } from "@/components/marketing/StateLandingPage";
import { redirectIfAuthenticated } from "@/lib/auth/redirect";

export const dynamic = "force-dynamic";

export default async function Home() {
  await redirectIfAuthenticated("state");
  return <StateLandingPage />;
}
