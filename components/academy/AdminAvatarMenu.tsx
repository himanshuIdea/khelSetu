"use client";

import { PortalAvatarMenu } from "@/components/auth/PortalAvatarMenu";

type AdminAvatarMenuProps = {
  initials: string;
};

export function AdminAvatarMenu({ initials }: AdminAvatarMenuProps) {
  return <PortalAvatarMenu initials={initials} portal="admin" />;
}
