import { redirect } from "next/navigation";
import { resolveAuthenticatedEntryRedirect } from "@/lib/auth/redirect";

export default async function Home() {
  redirect(await resolveAuthenticatedEntryRedirect());
}
