import { CashIcon, ShieldIcon, UpIcon } from "@/components/academy/icons";
import {
  PageBody,
  PageHeader,
  Pill,
  SectionTitle,
  StatCard,
  StatGrid,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { statePageMeta } from "@/lib/state-nav";
import { fundSchemes } from "@/lib/state-mock-data";

const meta = statePageMeta.funds;

const tokens = [
  { label: "Diet token", detail: "Empanelled grocers / mess only", amount: "₹2,000", status: "60% used", iconBg: "var(--green-soft)", iconColor: "#0E9B72" },
  { label: "Gear / kit token", detail: "Approved sports retailers only", amount: "₹3,500", status: "unused", iconBg: "var(--blue-soft)", iconColor: "#2756D8" },
  { label: "Travel token", detail: "Competition travel only", amount: "₹1,200", status: "100% used", iconBg: "var(--purple-soft)", iconColor: "#6443E0" },
];

export default function FundsPage() {
  return (
    <PageBody>
      <PageHeader title={meta.title} subtitle={meta.subtitle} actionLabel={meta.actionLabel!} actionIcon={<CashIcon />} />

      <StatGrid>
        <StatCard compact value="₹38.6 Cr" label="Disbursed via DBT" delta={<span className="text-green flex items-center gap-1"><UpIcon className="w-3 h-3" />82% of allocation</span>} />
        <StatCard compact value="24,800" label="Beneficiaries paid" />
        <StatCard compact value="142" label="Pending approval" valueColor="#C77F12" />
        <StatCard compact value="98.6%" label="Paid on time" valueColor="#0E9B72" />
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-[1.85fr_1.05fr] gap-3.5">
        <div className="bg-card border border-line rounded-(--radius) px-[18px] py-3.5 overflow-x-auto">
          <div className="flex justify-between items-center mb-1 pr-3">
            <SectionTitle title="Scheme-wise utilisation" subtitle="allocated vs disbursed" />
          </div>
          <table className="w-full border-collapse min-w-[560px]">
            <thead>
              <tr>
                {["Scheme", "Beneficiaries", "Disbursed", "Utilisation"].map((h) => (
                  <th key={h} className="text-left text-[10.5px] tracking-[0.6px] uppercase text-muted2 font-semibold px-3.5 pb-[11px]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fundSchemes.map((s) => (
                <TableRow key={s.name}>
                  <TableCell className="pl-0">
                    <div className="font-semibold text-[13px] text-ink">{s.name}</div>
                    <div className="text-[11.5px] text-muted">{s.detail}</div>
                  </TableCell>
                  <TableCell>{s.beneficiaries}</TableCell>
                  <TableCell>{s.disbursed}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-[78px] h-[18px] bg-line2 rounded-md overflow-hidden">
                        <div className="h-full rounded-md" style={{ width: `${s.util}%`, background: s.color }} />
                      </div>
                      <b className="text-xs" style={{ color: s.color === "#F5A623" ? "#C77F12" : s.color === "#2F6BFF" ? "#2756D8" : "#0E9B72" }}>
                        {s.util}%
                      </b>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-card border border-line rounded-(--radius) px-[18px] py-4">
          <div className="flex justify-between items-center mb-1">
            <SectionTitle title="Purpose-locked tokens" />
            <Pill variant="grey" className="bg-purple-soft text-[#5B3FD6] text-[9.5px]">
              <ShieldIcon className="w-[11px] h-[11px]" />
              On-chain
            </Pill>
          </div>
          <div className="text-[11.5px] text-muted mb-3">Rohit Sangwan · Sonipat — issued this month</div>
          {tokens.map((t) => (
            <div key={t.label} className="flex items-center gap-2.5 mb-3 last:mb-0">
              <div className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0" style={{ background: t.iconBg, color: t.iconColor }}>
                <CashIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-ink">{t.label}</div>
                <div className="text-[11.5px] text-muted">{t.detail}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[12.5px] font-bold text-text">{t.amount}</div>
                <div className="text-[11.5px] text-muted" style={t.status.includes("used") && !t.status.includes("unused") ? { color: "#0E9B72" } : undefined}>{t.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageBody>
  );
}
