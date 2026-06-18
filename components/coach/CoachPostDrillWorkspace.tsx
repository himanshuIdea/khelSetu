import { CoachPostDrillForm } from "@/components/coach/CoachPostDrillForm";
import type { CoachMediaFilterOptions } from "@/lib/repositories/coach-media";

type CoachPostDrillWorkspaceProps = {
  academyId: string;
  filterOptions: CoachMediaFilterOptions;
};

export function CoachPostDrillWorkspace({ academyId, filterOptions }: CoachPostDrillWorkspaceProps) {
  return <CoachPostDrillForm academyId={academyId} filterOptions={filterOptions} />;
}
