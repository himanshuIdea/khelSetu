import type { Metadata, Viewport } from "next";
import { PlayerLayoutClient } from "@/components/player/PlayerLayoutClient";
import { requirePlayerAccess } from "@/lib/auth/require-player-access";
import { isAcademyNurseryDeregistered } from "@/lib/repositories/state-nurseries";

export const metadata: Metadata = {
  title: "KhelSetu — Athlete",
  description: "Train, submit drills, and track your progress",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KhelSetu",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#F4F6FA",
};

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const { academyId } = await requirePlayerAccess();
  const nurseryDeregistered = await isAcademyNurseryDeregistered(academyId);

  return (
    <PlayerLayoutClient nurseryDeregistered={nurseryDeregistered}>{children}</PlayerLayoutClient>
  );
}
