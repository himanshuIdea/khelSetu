"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/academy/icons";
import { AddCoachModal } from "@/components/academy/AddCoachModal";
import { PageHeader } from "@/components/academy/shared";
import type { CoachFormOptions } from "@/lib/coaches";

type CoachesPageHeaderProps = {
  academyId: string;
  subtitle: string;
  formOptions: CoachFormOptions;
};

export function CoachesPageHeader({
  academyId,
  subtitle,
  formOptions,
}: CoachesPageHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Coaches"
        subtitle={subtitle}
        action={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] w-full sm:w-auto shrink-0"
          >
            <PlusIcon />
            Add coach
          </button>
        }
      />

      <AddCoachModal
        academyId={academyId}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formOptions={formOptions}
      />
    </>
  );
}
