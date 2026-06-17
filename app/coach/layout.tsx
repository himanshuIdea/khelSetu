import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { CoachLayoutContent } from "@/components/coach/CoachLayoutContent";
import { CoachShellSkeleton } from "@/components/coach/CoachShellSkeleton";

export const metadata: Metadata = {
  title: "KhelSetu — Coach",
  description: "View assignments, players, attendance, and teams",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KhelSetu Coach",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#F4F6FA",
};

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<CoachShellSkeleton />}>
      <CoachLayoutContent>{children}</CoachLayoutContent>
    </Suspense>
  );
}
