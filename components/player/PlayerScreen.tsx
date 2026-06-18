import { playerLayout } from "@/lib/player-layout";

type PlayerScreenProps = {
  children: React.ReactNode;
  className?: string;
};

/** Page root for `/player/*` — flex column that fills the app shell main area. */
export function PlayerScreen({ children, className = "" }: PlayerScreenProps) {
  return (
    <div className={`${playerLayout.body} w-full ${className}`.trim()}>{children}</div>
  );
}
