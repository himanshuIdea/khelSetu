import { StateLayoutClient } from "@/components/state/StateLayoutClient";
import { requireStateAccess } from "@/lib/auth/require-state-access";

export const dynamic = "force-dynamic";

export default async function StateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireStateAccess();

  return (
    <StateLayoutClient adminMeta={{ fullName: profile.fullName || "Sports Dept." }}>
      {children}
    </StateLayoutClient>
  );
}
