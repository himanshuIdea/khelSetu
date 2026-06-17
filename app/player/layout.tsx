import type { Metadata, Viewport } from "next";
import { PlayerLayoutClient } from "@/components/player/PlayerLayoutClient";
import { requirePlayerAccess } from "@/lib/auth/require-player-access";

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
  await requirePlayerAccess();

  return <PlayerLayoutClient>{children}</PlayerLayoutClient>;
}
