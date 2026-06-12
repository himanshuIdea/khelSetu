"use client";

import { useState } from "react";
import { AddTeamMembersModal } from "@/components/academy/AddTeamMembersModal";
import { PlusIcon, UsersIcon } from "@/components/academy/icons";
import { EmptyState } from "@/components/academy/shared";
import type { TeamMemberFormOptions } from "@/lib/teams";

type TeamMembersEmptyStateProps = {
  academyId: string;
  teamId: string;
  teamName: string;
  formOptions: TeamMemberFormOptions;
};

export function TeamMembersEmptyState({
  academyId,
  teamId,
  teamName,
  formOptions,
}: TeamMembersEmptyStateProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <EmptyState
        compact
        icon={<UsersIcon className="w-5 h-5" />}
        title="No members in this team"
        description={`Add players to ${teamName} to build your squad and pick a line-up.`}
        action={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px]"
          >
            <PlusIcon />
            Add players
          </button>
        }
      />

      <AddTeamMembersModal
        academyId={academyId}
        teamId={teamId}
        teamName={teamName}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formOptions={formOptions}
      />
    </>
  );
}
