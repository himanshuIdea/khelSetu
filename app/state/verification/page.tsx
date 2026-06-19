import { StatePageBody } from "@/components/state/StatePageBody";
import { VerificationWorkspace } from "@/components/state/VerificationWorkspace";
import { getVerificationBreakdown } from "@/lib/repositories/state-aggregates";
import { listVerificationQueue } from "@/lib/repositories/state-verification";

type VerificationPageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function VerificationPage({ searchParams }: VerificationPageProps) {
  const params = await searchParams;
  const [queue, breakdown] = await Promise.all([
    listVerificationQueue(),
    getVerificationBreakdown(),
  ]);

  return (
    <StatePageBody variant="list">
      <VerificationWorkspace
        queue={queue}
        breakdown={breakdown}
        initialFlaggedOnly={params.status === "flagged"}
      />
    </StatePageBody>
  );
}
