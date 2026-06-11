import { redirect } from "next/navigation";
import { SEED_ACADEMY_ID } from "@/lib/seed-constants";

export default function AcademyIndex() {
  redirect(`/academy/${SEED_ACADEMY_ID}/dashboard`);
}
