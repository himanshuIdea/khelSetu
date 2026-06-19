import { StateLayoutClient } from "@/components/state/StateLayoutClient";
import { requireStateAccess } from "@/lib/auth/require-state-access";

export const dynamic = "force-dynamic";

export default async function StateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStateAccess();

  return <StateLayoutClient>{children}</StateLayoutClient>;
}
