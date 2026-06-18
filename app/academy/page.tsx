import { redirect } from "next/navigation";
import { getAcademyBySlug } from "@/lib/repositories/academy";
import { SEED_ACADEMY_SLUG } from "@/lib/seed-constants";

export const dynamic = "force-dynamic";

export default async function AcademyIndex() {
  const academy = await getAcademyBySlug(SEED_ACADEMY_SLUG);
  if (!academy) {
    redirect("/login");
  }
  redirect(`/academy/${academy.id}/dashboard`);
}
