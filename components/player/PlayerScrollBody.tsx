import { playerScrollBodyClassName } from "@/lib/player-layout";

type PlayerScrollBodyProps = {
  children: React.ReactNode;
  className?: string;
};

/** Scrollable page body below a fixed header; shell `main` does not scroll. */
export function PlayerScrollBody({ children, className = "" }: PlayerScrollBodyProps) {
  return (
    <div className={`${playerScrollBodyClassName()} ${className}`.trim()}>
      {children}
    </div>
  );
}
