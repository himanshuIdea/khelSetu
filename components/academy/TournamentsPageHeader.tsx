"use client";

import { useState } from "react";
import { CreateTournamentModal } from "@/components/academy/CreateTournamentModal";
import { PlusIcon } from "@/components/academy/icons";
import { PageHeader } from "@/components/academy/shared";

type SportOption = { id: string; name: string };

type TournamentsPageHeaderProps = {
  academyId: string;
  sports: SportOption[];
};

export function TournamentsPageHeader({ academyId, sports }: TournamentsPageHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Tournaments"
        subtitle="Host inter- and intra-academy events with live brackets and mat scheduling."
        action={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] w-full sm:w-auto shrink-0"
          >
            <PlusIcon />
            Create tournament
          </button>
        }
      />

      <CreateTournamentModal
        academyId={academyId}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sports={sports}
      />
    </>
  );
}
