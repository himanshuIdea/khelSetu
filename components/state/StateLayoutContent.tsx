import { Suspense } from "react";
import { StateLayoutClient } from "@/components/state/StateLayoutClient";
import { StatePageContentSkeleton } from "@/components/state/StatePageContentSkeleton";
import { getStateAdminShellMeta } from "@/lib/auth/require-state-access";
import { getFundsHeaderFyMeta } from "@/lib/repositories/state-funds";

type StateLayoutContentProps = {
  children: React.ReactNode;
};

export async function StateLayoutContent({ children }: StateLayoutContentProps) {
  const adminMeta = await getStateAdminShellMeta();
  const fundsFyMeta = await getFundsHeaderFyMeta();

  return (
    <StateLayoutClient adminMeta={adminMeta} fundsFyMeta={fundsFyMeta}>
      <Suspense fallback={<StatePageContentSkeleton />}>{children}</Suspense>
    </StateLayoutClient>
  );
}
