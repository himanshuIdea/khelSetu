import Link from "next/link";
import { CredentialsHub } from "@/components/academy/credentials/CredentialsHub";
import { PageBody, PageHeader } from "@/components/academy/shared";
import { getCredentialSummary } from "@/lib/repositories/credentials";

type CredentialsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CredentialsPage({ params }: CredentialsPageProps) {
  const { id } = await params;
  const summary = await getCredentialSummary(id);

  return (
    <PageBody>
      <div className="mb-2">
        <Link
          href={`/academy/${id}/dashboard`}
          className="text-[12.5px] font-semibold text-brand hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>
      <PageHeader
        title="Credential management"
        subtitle="Generate usernames and temporary passwords. Share them once — members set their own password on first sign-in."
      />
      <CredentialsHub academyId={id} summary={summary} />
    </PageBody>
  );
}
