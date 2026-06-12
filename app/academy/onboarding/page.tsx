import { redirect } from "next/navigation";

export default function AcademyOnboardingRedirect() {
  redirect("/auth/onboarding");
}
