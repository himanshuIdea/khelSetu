import { CalendarIcon } from "@/components/academy/icons";
import {
  AcademyTable,
  FilterPills,
  PageBody,
  PageHeader,
  Pill,
  StatCard,
  StatGrid,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { api } from "@/lib/api";
import { resolveAcademy } from "@/lib/repositories/resolve-academy";

export const dynamic = "force-dynamic";

type AttendancePageProps = {
  params: Promise<{ id: string }>;
};

export default async function AttendancePage({ params }: AttendancePageProps) {
  const { id } = await params;
  const academy = await resolveAcademy(id);
  const attendanceSessions = await api.attendance.sessions(academy.id);

  const marked = attendanceSessions.filter((s) => s.status === "Marked");
  const avgRate =
    marked.length > 0
      ? Math.round(
          marked.reduce((sum, s) => sum + (s.present / Math.max(s.total, 1)) * 100, 0) / marked.length
        )
      : 0;
  const todayCount = attendanceSessions.filter((s) => s.time !== "Yesterday" && !s.time.includes("Mar")).length;
  const lowCount = attendanceSessions.filter((s) => s.status === "Low").length;

  const attendanceStats = [
    { value: `${avgRate}%`, label: "Avg. attendance · June", iconBg: "var(--blue-soft)", iconColor: "#2756D8" },
    { value: String(marked.length), label: "Sessions marked", iconBg: "var(--green-soft)", iconColor: "#0E9B72" },
    { value: String(todayCount), label: "Sessions today", iconBg: "var(--brand-soft)", iconColor: "var(--brand-d)" },
    { value: String(lowCount), label: "Low-attendance batches", iconBg: "var(--amber-soft)", iconColor: "#C77F12", valueColor: "var(--amber)" },
  ];

  return (
    <PageBody>
      <PageHeader
        title="Attendance"
        subtitle="Mark daily sessions, track batch-wise presence and spot absentees early."
        actionLabel="Mark attendance"
      />

      <StatGrid>
        {attendanceStats.map((s) => (
          <StatCard
            key={s.label}
            value={s.value}
            label={s.label}
            icon={<CalendarIcon className="w-5 h-5" />}
            iconBg={s.iconBg}
            iconColor={s.iconColor}
            valueColor={s.valueColor}
          />
        ))}
      </StatGrid>

      <FilterPills>
        <Pill variant="brand" className="px-[13px] py-2 shrink-0">Today</Pill>
        <Pill variant="grey" className="px-[13px] py-2 shrink-0">This week</Pill>
        <Pill variant="grey" className="px-[13px] py-2 shrink-0">All sports</Pill>
      </FilterPills>

      <AcademyTable headers={["Batch", "Sport", "Coach", "Time", "Present", "Rate", "Status"]} minWidth={680}>
        {attendanceSessions.map((s) => (
          <TableRow key={`${s.batch}-${s.time}`}>
            <TableCell><b>{s.batch}</b></TableCell>
            <TableCell>{s.sport}</TableCell>
            <TableCell>{s.coach}</TableCell>
            <TableCell>{s.time}</TableCell>
            <TableCell>{s.present > 0 ? `${s.present} / ${s.total}` : `— / ${s.total}`}</TableCell>
            <TableCell><b>{s.rate}</b></TableCell>
            <TableCell><Pill variant={s.statusVariant}>{s.status}</Pill></TableCell>
          </TableRow>
        ))}
      </AcademyTable>
    </PageBody>
  );
}
