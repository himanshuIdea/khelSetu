import { PlayerBrandMark } from "@/components/player/PlayerChrome";
import { playerHeaderClassName, playerLayout } from "@/lib/player-layout";

type PlayerPageHeaderProps = {
  title?: string;
  brand?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  below?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function PlayerPageHeader({
  title,
  brand = false,
  leading,
  trailing,
  below,
  children,
  className = "",
}: PlayerPageHeaderProps) {
  if (children) {
    return <header className={playerHeaderClassName(className)}>{children}</header>;
  }

  return (
    <header className={playerHeaderClassName(className)}>
      <div className={playerLayout.headerRow}>
        {leading}
        {brand ? (
          <PlayerBrandMark />
        ) : title ? (
          <h1 className={`${playerLayout.title} ${leading ? "flex-1" : ""}`.trim()}>{title}</h1>
        ) : null}
        {trailing && (
          <>
            <div className="flex-1 min-w-0" />
            <div className="flex items-center gap-2 shrink-0">{trailing}</div>
          </>
        )}
      </div>
      {below && <div className="mt-3 min-w-0">{below}</div>}
    </header>
  );
}
