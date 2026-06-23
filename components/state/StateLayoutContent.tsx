import { StateLayoutClient } from "@/components/state/StateLayoutClient";
import { requireStateAccess } from "@/lib/auth/require-state-access";

type StateLayoutContentProps = {
  children: React.ReactNode;
};

export async function StateLayoutContent({ children }: StateLayoutContentProps) {
  const profile = await requireStateAccess();

  return (
    <StateLayoutClient adminMeta={{ fullName: profile.fullName || "Sports Dept." }}>
      {children}
    </StateLayoutClient>
  );
}
