import Link from "next/link";
import { CredentialsGrid } from "@/components/academy/credentials/CredentialsGrid";
import { PageBody, PageHeader } from "@/components/academy/shared";
import { listAthleteCredentials } from "@/lib/repositories/credentials";

type AthletesCredentialsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AthletesCredentialsPage({ params }: AthletesCredentialsPageProps) {
  const { id } = await params;
  const rows = await listAthleteCredentials(id);

  return (
    <PageBody>
      <div className="mb-2">
        <Link
          href={`/academy/${id}/credentials`}
          className="text-[12.5px] font-semibold text-brand hover:underline"
        >
          ← Credential management
        </Link>
      </div>
      <PageHeader
        title="Athletes"
        subtitle="Issue player portal credentials for active roster members."
      />
      <CredentialsGrid academyId={id} role="athletes" title="Athletes" rows={rows} />
    </PageBody>
  );
}
