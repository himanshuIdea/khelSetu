import { Suspense } from "react";
import { StateLayoutClient } from "@/components/state/StateLayoutClient";
import { StatePageContentSkeleton } from "@/components/state/StatePageContentSkeleton";
import { getStateAdminShellMeta } from "@/lib/auth/require-state-access";

type StateLayoutContentProps = {
  children: React.ReactNode;
};

export async function StateLayoutContent({ children }: StateLayoutContentProps) {
  const adminMeta = await getStateAdminShellMeta();

  return (
    <StateLayoutClient adminMeta={adminMeta}>
      <Suspense fallback={<StatePageContentSkeleton />}>{children}</Suspense>
    </StateLayoutClient>
  );
}
