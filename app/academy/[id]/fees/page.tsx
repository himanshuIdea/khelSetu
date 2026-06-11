import {
  AcademyTable,
  Avatar,
  PageBody,
  PageHeader,
  Pill,
  StatCard,
  StatGrid,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import {
  CapIcon,
  CashIcon,
  CheckIcon,
  ClockIcon,
  UsersIcon,
} from "@/components/academy/icons";
import { api } from "@/lib/api";
import { resolveAcademy } from "@/lib/repositories/resolve-academy";

export const dynamic = "force-dynamic";

const payrollIcons = {
  users: UsersIcon,
  cash: CashIcon,
  cap: CapIcon,
  clock: ClockIcon,
};

type FeesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function FeesPage({ params }: FeesPageProps) {
  const { id } = await params;
  const academy = await resolveAcademy(id);

  const [payrollStats, staffMembers] = await Promise.all([
    api.payroll.stats(academy.id),
    api.payroll.staff(academy.id),
  ]);

  const monthLabel = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <PageBody>
      <PageHeader
        title={
          <>
            Staff & Payroll{" "}
            <span className="text-muted font-medium text-base">· {monthLabel}</span>
          </>
        }
        subtitle="Coaches and support staff, salaries, attendance and payslips — in one place."
        actionLabel="Run payroll"
        actionIcon={<CashIcon className="w-4 h-4" />}
      />

      <StatGrid>
        {payrollStats.map((s) => {
          const Icon = payrollIcons[s.icon];
          return (
            <StatCard
              key={s.label}
              value={s.value}
              label={s.label}
              icon={<Icon className="w-5 h-5" />}
              iconBg={s.iconBg}
              iconColor={s.iconColor}
              compact
            />
          );
        })}
      </StatGrid>

      <AcademyTable headers={["Staff member", "Role", "Type", "Days present", "Monthly salary", "Status", ""]} minWidth={720}>
        {staffMembers.map((s) => (
          <TableRow key={s.initials}>
            <TableCell>
              <div className="flex items-center gap-[11px]">
                <Avatar initials={s.initials} color={s.avatarColor} />
                <div className="font-semibold text-[13px] text-ink">{s.name}</div>
              </div>
            </TableCell>
            <TableCell>{s.role}</TableCell>
            <TableCell>{s.type}</TableCell>
            <TableCell>{s.daysPresent}</TableCell>
            <TableCell><b>{s.salary}</b></TableCell>
            <TableCell>
              <Pill variant={s.statusVariant}>
                {s.statusVariant === "green" ? <CheckIcon /> : <ClockIcon className="w-[11px] h-[11px]" />}
                {s.status}
              </Pill>
            </TableCell>
            <TableCell><Pill variant="grey">{s.action}</Pill></TableCell>
          </TableRow>
        ))}
      </AcademyTable>
    </PageBody>
  );
}
