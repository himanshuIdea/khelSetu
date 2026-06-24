import { AttendanceWorkspace } from "@/components/academy/AttendanceWorkspace";
import { PageBody, PageHeader } from "@/components/academy/shared";
import { requireCoachAccess } from "@/lib/auth/require-coach-access";
import { getCoachAttendanceFormOptions } from "@/lib/repositories/attendance";

type CoachAttendancePageProps = {
  searchParams: Promise<{ batch?: string }>;
};

export default async function CoachAttendancePage({ searchParams }: CoachAttendancePageProps) {
  const { batch: batchId } = await searchParams;
  const { academyId, coachId } = await requireCoachAccess();

  const formOptions = await getCoachAttendanceFormOptions(academyId, coachId);

  return (
    <PageBody>
      <AttendanceWorkspace
        academyId={academyId}
        formOptions={formOptions}
        sessions={[]}
        coachMode
        initialBatchId={batchId}
      >
        <PageHeader
          title="Attendance"
          subtitle="Mark daily sessions for your assigned batches and track presence."
        />
      </AttendanceWorkspace>
    </PageBody>
  );
}
