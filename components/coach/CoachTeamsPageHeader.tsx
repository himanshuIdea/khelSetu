"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/academy/icons";
import { AddTeamModal } from "@/components/academy/AddTeamModal";
import { PageHeader } from "@/components/academy/shared";
import type { TeamFormOptions } from "@/lib/teams";

type CoachTeamsPageHeaderProps = {
  academyId: string;
  coachId: string;
  subtitle: string;
  formOptions: TeamFormOptions;
};

export function CoachTeamsPageHeader({
  academyId,
  coachId,
  subtitle,
  formOptions,
}: CoachTeamsPageHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="My teams"
        subtitle={subtitle}
        action={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] w-full sm:w-auto shrink-0 min-h-[44px]"
          >
            <PlusIcon />
            Create team
          </button>
        }
      />

      <AddTeamModal
        academyId={academyId}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formOptions={formOptions}
        fixedCoachId={coachId}
      />
    </>
  );
}
