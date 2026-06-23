import Link from "next/link";

type DashboardCredentialsCardProps = {
  academyId: string;
  pendingTotal: number;
};

export function DashboardCredentialsCard({
  academyId,
  pendingTotal,
}: DashboardCredentialsCardProps) {
  return (
    <Link
      href={`/academy/${academyId}/credentials`}
      className="group block bg-card border border-line rounded-2xl p-4 sm:p-5 shadow-sm hover:border-brand/40 hover:shadow-md transition-all min-w-0 w-full mb-3"
    >
      <div className="flex items-center justify-between gap-3 min-w-0 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[15px] sm:text-[16px] font-bold text-ink">Credential management</h2>
            {pendingTotal > 0 && (
              <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-brand-soft text-brand-d">
                {pendingTotal} pending
              </span>
            )}
          </div>
          <p className="text-[12.5px] text-muted mt-1 leading-snug">
            Usernames & temporary passwords for athletes, coaches, and support staff
          </p>
        </div>
        <span className="text-lg text-muted2 group-hover:text-brand shrink-0 transition-colors">
          →
        </span>
      </div>
    </Link>
  );
}
