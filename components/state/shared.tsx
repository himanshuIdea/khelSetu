import type { SportLegendItem } from "@/lib/state-portal";

const segmentColors = ["#FF6B2C", "#2F6BFF", "#7C5CFC", "#12B886", "#9AA4B8"];

export function SportLegend({ items }: { items: SportLegendItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 mb-3.5">
      {items.map((s) => (
        <span key={s.label} className="inline-flex items-center gap-1.5 text-[11.5px] text-muted">
          <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}

export function StackedBarRow({
  label,
  total,
  widthPercent,
  segments,
}: {
  label: string;
  total: string;
  widthPercent: number;
  segments: number[];
}) {
  return (
    <div className="flex items-center gap-2.5 mb-2.5 last:mb-0">
      <span className="text-[12px] font-medium text-text w-[72px] shrink-0">{label}</span>
      <div className="flex-1 h-[18px] bg-line2 rounded-md overflow-hidden">
        <div className="flex h-full" style={{ width: `${widthPercent}%` }}>
          {segments.map((pct, i) => (
            <span
              key={i}
              className="h-full"
              style={{ width: `${pct}%`, background: segmentColors[i] }}
            />
          ))}
        </div>
      </div>
      <span className="text-[11.5px] font-semibold text-text w-10 text-right shrink-0">{total}</span>
    </div>
  );
}

export function FillBarRow({
  label,
  value,
  percent,
  color,
  labelWidth = "w-24",
}: {
  label: string;
  value: string;
  percent: number;
  color: string;
  labelWidth?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-2.5 last:mb-0">
      <span className={`text-[12px] font-medium text-text shrink-0 ${labelWidth}`}>{label}</span>
      <div className="flex-1 h-[18px] bg-line2 rounded-md overflow-hidden">
        <div className="h-full rounded-md" style={{ width: `${percent}%`, background: color }} />
      </div>
      <span className="text-[11.5px] font-semibold text-text w-10 text-right shrink-0">{value}</span>
    </div>
  );
}

export function StateGhostButton({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-[7px] bg-card border border-line text-ink font-semibold text-[13px] py-[11px] px-4 rounded-[10px] w-full sm:w-auto shrink-0"
    >
      {icon}
      {children}
    </button>
  );
}
