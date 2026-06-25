import { EmptyState } from "@/components/academy/shared";
import { playerLayout } from "@/lib/player-layout";
import { playerTabBarPaddingClass } from "@/lib/player-nav";

type PlayerEmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
  /** center = fills remaining page height; inline = embedded in scroll content */
  variant?: "center" | "inline";
};

export function PlayerEmptyState({
  title,
  description,
  icon,
  action,
  compact = false,
  variant = "center",
}: PlayerEmptyStateProps) {
  if (variant === "inline") {
    return (
      <EmptyState
        title={title}
        description={description}
        icon={icon}
        action={action}
        compact={compact}
        className="w-full min-w-0"
      />
    );
  }

  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center min-h-[min(320px,50dvh)] min-w-0 px-4 sm:px-[18px] py-8 sm:py-10 ${playerTabBarPaddingClass}`}
    >
      <EmptyState
        title={title}
        description={description}
        icon={icon}
        action={action}
        compact={compact}
        className="w-full max-w-sm min-w-0"
      />
    </div>
  );
}
