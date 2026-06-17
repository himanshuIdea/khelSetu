import { redirect } from "next/navigation";
import { playerRoutes } from "@/lib/player-nav";

export default function MobileHomeRedirect() {
  redirect(playerRoutes.home);
}
