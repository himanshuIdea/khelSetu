import { redirect } from "next/navigation";
import { coachRoutes } from "@/lib/coach-nav";

export default function CoachIndexPage() {
  redirect(coachRoutes.home);
}
