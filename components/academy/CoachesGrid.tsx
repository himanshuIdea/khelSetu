"use client";

import { useState } from "react";
import { CoachAssignmentsModal } from "@/components/academy/CoachAssignmentsModal";
import { CoachCard } from "@/components/academy/CoachCard";
import type { AssignCoachFormOptions } from "@/lib/coaches";
import type { Coach } from "@/lib/repositories/types";

type CoachesGridProps = {
  academyId: string;
  coaches: Coach[];
  formOptions: AssignCoachFormOptions;
};

export function CoachesGrid({ academyId, coaches, formOptions }: CoachesGridProps) {
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coaches.map((coach) => (
          <CoachCard key={coach.id} coach={coach} onClick={() => setSelectedCoach(coach)} />
        ))}
      </div>

      <CoachAssignmentsModal
        academyId={academyId}
        coach={selectedCoach}
        open={selectedCoach !== null}
        formOptions={formOptions}
        onClose={() => setSelectedCoach(null)}
      />
    </>
  );
}
