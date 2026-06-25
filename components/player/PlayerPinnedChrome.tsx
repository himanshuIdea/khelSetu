import { playerLayout } from "@/lib/player-layout";

type PlayerPinnedChromeProps = {
  children: React.ReactNode;
  className?: string;
};

/** Fixed chrome between header and scroll body (e.g. Home filter pills). */
export function PlayerPinnedChrome({ children, className = "" }: PlayerPinnedChromeProps) {
  return (
    <div className={`${playerLayout.pinnedChrome} ${className}`.trim()}>{children}</div>
  );
}
