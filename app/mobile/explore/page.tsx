import { redirect } from "next/navigation";
import { playerRoutes } from "@/lib/player-nav";

export default function MobileExploreRedirect() {
  redirect(playerRoutes.explore);
}
