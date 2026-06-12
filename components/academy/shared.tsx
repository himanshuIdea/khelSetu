import { PlusIcon } from "./icons";

type PageHeaderProps = {
  title: React.ReactNode;
  subtitle: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  action?: React.ReactNode;
  onActionClick?: () => void;
};

export function PageHeader({
  title,
  subtitle,
  actionLabel,
  actionIcon = <PlusIcon />,
  action,
  onActionClick,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-[18px]">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-[22px] font-bold text-ink tracking-[-0.3px]">
          {title}
        </h1>
        <p className="text-[13px] text-muted mt-[3px]">{subtitle}</p>
      </div>
      {action ?? (
        <button
          type="button"
          onClick={onActionClick}
          className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] w-full sm:w-auto shrink-0"
        >
          {actionIcon}
          {actionLabel}
        </button>
      )}
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
      className={`flex-1 min-w-0 px-4 py-4 sm:px-6 sm:py-5 lg:px-[26px] lg:py-6 overflow-x-hidden overflow-y-auto ${className}`}
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
    <div className={`flex flex-col lg:flex-row gap-1 lg:gap-[5px] min-w-0 w-full ${className}`}>
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
    <div className={`w-full min-w-0 lg:w-[316px] shrink-0 ${className} ml-4 mr-4`}>
      {children}
    </div>
  );
}

export function FilterPills({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain pb-1 mb-3.5 pr-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex flex-nowrap items-center gap-[9px] w-max max-w-none pr-3">
        {children}
      </div>
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

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className = "",
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`bg-card border border-line rounded-(--radius) shadow-card text-center ${compact ? "px-4 py-8" : "px-6 py-12"} ${className}`}
    >
      {icon && (
        <div className="w-11 h-11 rounded-[12px] bg-surface text-muted2 flex items-center justify-center mx-auto mb-3">
          {icon}
        </div>
      )}
      <div className={`font-semibold text-ink ${compact ? "text-[13px]" : "text-[15px]"}`}>{title}</div>
      {description && (
        <p
          className={`text-muted mt-1.5 mx-auto leading-relaxed ${compact ? "text-[11.5px] max-w-[280px]" : "text-[13px] max-w-[360px]"}`}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
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
  minWidth,
  columnWidths,
  columnClassNames,
  className = "",
}: {
  headers: string[];
  children: React.ReactNode;
  minWidth?: number;
  columnWidths?: string[];
  columnClassNames?: string[];
  className?: string;
}) {
  const useFixedLayout = columnWidths != null && columnWidths.length === headers.length;

  return (
    <div className={`min-w-0 w-full max-w-full bg-card border border-line rounded-(--radius) shadow-card overflow-hidden ${className}`}>
      <div className="overflow-x-auto overscroll-x-contain max-w-full px-1 sm:px-1.5 pt-1.5 pb-1 [-webkit-overflow-scrolling:touch]">
        <table
          className={`w-full border-collapse ${useFixedLayout ? "table-fixed" : "table-auto"}`}
          style={minWidth ? { minWidth: `${minWidth}px` } : undefined}
        >
          {useFixedLayout && (
            <colgroup>
              {columnWidths.map((width, index) => (
                <col key={`${headers[index]}-${width}`} style={{ width }} />
              ))}
            </colgroup>
          )}
          <thead>
            <tr>
              {headers.map((h, index) => (
                <th
                  key={`${h}-${index}`}
                  className={`text-left text-[10.5px] tracking-[0.6px] uppercase text-muted2 font-semibold px-2 sm:px-3.5 pb-[11px] whitespace-nowrap ${columnClassNames?.[index] ?? ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function TableRow({
  children,
  highlighted,
  onClick,
}: {
  children: React.ReactNode;
  highlighted?: boolean;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={
        highlighted
          ? "bg-brand-soft"
          : onClick
            ? "cursor-pointer hover:bg-brand-soft/60"
            : undefined
      }
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
      className={`px-2 py-3 sm:px-3.5 sm:py-[13px] border-t border-line2 text-[13px] text-text align-middle ${className}`}
    >
      {children}
    </td>
  );
}

export function AcademyCardList({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`lg:hidden min-w-0 w-full max-w-full bg-card border border-line rounded-(--radius) shadow-card overflow-hidden divide-y divide-line2 ${className}`}
    >
      {children}
    </div>
  );
}

export function AcademyCardListItem({
  children,
  highlighted,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  highlighted?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const interactive = onClick != null;

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`min-w-0 w-full px-3.5 py-3.5 text-left ${
        highlighted
          ? "bg-brand-soft"
          : interactive
            ? "cursor-pointer hover:bg-brand-soft/60 active:bg-brand-soft/80"
            : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
