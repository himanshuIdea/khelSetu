import { PlusIcon } from "./icons";

type PageHeaderProps = {
  title: React.ReactNode;
  subtitle: string;
  actionLabel: string;
  actionIcon?: React.ReactNode;
};

export function PageHeader({
  title,
  subtitle,
  actionLabel,
  actionIcon = <PlusIcon />,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-[18px]">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-[22px] font-bold text-ink tracking-[-0.3px]">
          {title}
        </h1>
        <p className="text-[13px] text-muted mt-[3px]">{subtitle}</p>
      </div>
      <button
        type="button"
        className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] w-full sm:w-auto shrink-0"
      >
        {actionIcon}
        {actionLabel}
      </button>
    </div>
  );
}

export function PageBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex-1 px-4 py-4 sm:px-6 sm:py-5 lg:px-[26px] lg:py-6 overflow-y-auto ${className}`}
    >
      {children}
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
      {children}
    </div>
  );
}

export function SplitLayout({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col lg:flex-row gap-4 lg:gap-[18px] ${className}`}>
      {children}
    </div>
  );
}

export function SidePanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`w-full lg:w-[316px] shrink-0 ${className}`}>
      {children}
    </div>
  );
}

export function FilterPills({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto -mx-1 px-1 pb-1 mb-3.5">
      <div className="flex gap-2 min-w-max">{children}</div>
    </div>
  );
}

type StatCardProps = {
  value: React.ReactNode;
  label: string;
  delta?: React.ReactNode;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  valueColor?: string;
  compact?: boolean;
};

export function StatCard({
  value,
  label,
  delta,
  icon,
  iconBg,
  iconColor,
  valueColor,
  compact,
}: StatCardProps) {
  return (
    <div className={`bg-card border border-line rounded-(--radius) ${compact ? "p-4" : "p-[18px] stat"}`}>
      {icon && (
        <div
          className="w-10 h-10 rounded-[11px] flex items-center justify-center mb-2.5"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      )}
      <div
        className={`font-bold text-ink tracking-[-0.5px] leading-none ${compact ? "text-[23px]" : "text-[27px]"}`}
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
      <div className="text-xs text-muted mt-1.5">{label}</div>
      {delta && (
        <div className="text-[11.5px] font-semibold mt-2 inline-flex items-center gap-1">
          {delta}
        </div>
      )}
    </div>
  );
}

export type PillVariant =
  | "green"
  | "red"
  | "amber"
  | "blue"
  | "grey"
  | "brand";

const pillStyles: Record<PillVariant, string> = {
  green: "bg-green-soft text-[#0E9B72]",
  red: "bg-red-soft text-[#D63B3B]",
  amber: "bg-amber-soft text-[#C77F12]",
  blue: "bg-blue-soft text-[#2756D8]",
  grey: "bg-surface text-[#62708C]",
  brand: "bg-brand-soft text-brand-d",
};

export function Pill({
  variant,
  children,
  className = "",
}: {
  variant: PillVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-[5px] text-[11px] font-semibold px-[9px] py-1 rounded-full ${pillStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Avatar({
  initials,
  color,
  size = "md",
  className = "",
}: {
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "w-[30px] h-[30px] text-[11px] rounded-[9px]",
    md: "w-[34px] h-[34px] text-[12.5px] rounded-[9px]",
    lg: "w-16 h-16 text-[22px] rounded-[18px]",
  };
  return (
    <div
      className={`flex items-center justify-center font-bold text-white shrink-0 ${sizes[size]} ${className}`}
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <div className="text-[14.5px] font-bold text-ink">{title}</div>
      {subtitle && (
        <div className="text-[11.5px] text-muted mt-0.5">{subtitle}</div>
      )}
    </div>
  );
}

export function ActivityRow({
  icon,
  iconBg,
  iconColor,
  text,
  time,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  text: React.ReactNode;
  time: string;
}) {
  return (
    <div className="flex gap-[11px] py-2.5 border-t border-line2 first:border-t-0 first:pt-0">
      <div
        className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div>
        <div className="text-[12.5px] text-text leading-snug">{text}</div>
        <div className="text-[10.5px] text-muted2 mt-0.5">{time}</div>
      </div>
    </div>
  );
}

export function AcademyTable({
  headers,
  children,
  minWidth = 600,
}: {
  headers: string[];
  children: React.ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="bg-card border border-line rounded-(--radius) shadow-card px-1.5 pt-1.5 pb-1 overflow-x-auto -mx-1">
      <table
        className="w-full border-collapse"
        style={{ minWidth: `${minWidth}px` }}
      >
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="text-left text-[10.5px] tracking-[0.6px] uppercase text-muted2 font-semibold px-3.5 pb-[11px]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function TableRow({
  children,
  highlighted,
}: {
  children: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <tr
      className={highlighted ? "bg-brand-soft" : undefined}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`px-3.5 py-[13px] border-t border-line2 text-[13px] text-text align-middle ${className}`}
    >
      {children}
    </td>
  );
}
