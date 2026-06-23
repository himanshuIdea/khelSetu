import { Suspense } from "react";
import { StateLayoutContent } from "@/components/state/StateLayoutContent";
import { StateShellSkeleton } from "@/components/state/StateShellSkeleton";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export default function StateLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<StateShellSkeleton />}>
      <StateLayoutContent>{children}</StateLayoutContent>
    </Suspense>
  );
}
