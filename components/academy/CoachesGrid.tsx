"use client";

import { useMemo, useState } from "react";
import { useAcademyPageSearch } from "@/components/academy/AcademySearchContext";
import { CoachAssignmentsModal } from "@/components/academy/CoachAssignmentsModal";
import { CoachCard } from "@/components/academy/CoachCard";
import { EmptyState } from "@/components/academy/shared";
import { CapIcon } from "@/components/academy/icons";
import type { AssignCoachFormOptions } from "@/lib/coaches";
import type { Coach } from "@/lib/repositories/types";
import { matchesStateTextSearch } from "@/lib/state-search";

type CoachesGridProps = {
  academyId: string;
  coaches: Coach[];
  formOptions: AssignCoachFormOptions;
};

export function CoachesGrid({ academyId, coaches, formOptions }: CoachesGridProps) {
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const searchQuery = useAcademyPageSearch();

  const filteredCoaches = useMemo(() => {
    if (!searchQuery.trim()) return coaches;
    return coaches.filter((coach) =>
      matchesStateTextSearch(searchQuery, [coach.name, coach.role, coach.badgeLabel])
    );
  }, [coaches, searchQuery]);

  if (coaches.length === 0) {
    return null;
  }

  if (filteredCoaches.length === 0) {
    return (
      <EmptyState
        compact
        className="w-full min-w-0"
        icon={<CapIcon className="w-5 h-5" />}
        title="No coaches match your search"
        description="Try a different search term."
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCoaches.map((coach) => (
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
