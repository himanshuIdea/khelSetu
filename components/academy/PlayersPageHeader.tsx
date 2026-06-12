"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/academy/icons";
import { AddPlayerModal } from "@/components/academy/AddPlayerModal";
import { PageHeader } from "@/components/academy/shared";
import type { PlayerFormOptions } from "@/lib/players";

type PlayersPageHeaderProps = {
  academyId: string;
  subtitle: string;
  formOptions: PlayerFormOptions;
};

export function PlayersPageHeader({
  academyId,
  subtitle,
  formOptions,
}: PlayersPageHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Players"
        subtitle={subtitle}
        action={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] w-full sm:w-auto shrink-0"
          >
            <PlusIcon />
            Add player
          </button>
        }
      />

      <AddPlayerModal
        academyId={academyId}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formOptions={formOptions}
      />
    </>
  );
}
