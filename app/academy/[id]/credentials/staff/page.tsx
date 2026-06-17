import Link from "next/link";
import { CredentialsGrid } from "@/components/academy/credentials/CredentialsGrid";
import { PageBody, PageHeader } from "@/components/academy/shared";
import { listStaffCredentials } from "@/lib/repositories/credentials";

type StaffCredentialsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffCredentialsPage({ params }: StaffCredentialsPageProps) {
  const { id } = await params;
  const rows = await listStaffCredentials(id);

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
        title="Support staff"
        subtitle="Issue credentials for physio, admin, and other support roles."
      />
      <CredentialsGrid academyId={id} role="staff" title="Support staff" rows={rows} />
    </PageBody>
  );
}
