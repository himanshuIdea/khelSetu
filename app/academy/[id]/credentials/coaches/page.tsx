import Link from "next/link";
import { CredentialsGrid } from "@/components/academy/credentials/CredentialsGrid";
import { PageBody, PageHeader } from "@/components/academy/shared";
import { listCoachCredentials } from "@/lib/repositories/credentials";

type CoachesCredentialsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CoachesCredentialsPage({ params }: CoachesCredentialsPageProps) {
  const { id } = await params;
  const rows = await listCoachCredentials(id);

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
        title="Coaches"
        subtitle="Issue login credentials for coaching staff."
      />
      <CredentialsGrid academyId={id} role="coaches" title="Coaches" rows={rows} />
    </PageBody>
  );
}
