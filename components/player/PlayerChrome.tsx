import Link from "next/link";
import { playerLayout } from "@/lib/player-layout";

type PlayerBrandMarkProps = {
  className?: string;
};

export function PlayerBrandMark({ className = "" }: PlayerBrandMarkProps) {
  return (
    <div className={`${playerLayout.brandTitle} ${className}`.trim()}>
      Khel<span className="text-brand">Setu</span>
    </div>
  );
}

type PlayerIconButtonProps = {
  children: React.ReactNode;
  ariaLabel: string;
  href?: string;
  onClick?: () => void;
  className?: string;
};

export function PlayerIconButton({
  children,
  ariaLabel,
  href,
  onClick,
  className = "",
}: PlayerIconButtonProps) {
  const classes = `${playerLayout.iconButton} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" aria-label={ariaLabel} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}

function PlayerBackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 19.5L8.25 12l7.5-7.5"
      />
    </svg>
  );
}

type PlayerBackButtonProps = {
  href: string;
  label?: string;
};

export function PlayerBackButton({ href, label = "Go back" }: PlayerBackButtonProps) {
  return (
    <PlayerIconButton href={href} ariaLabel={label} className="text-ink">
      <PlayerBackIcon />
    </PlayerIconButton>
  );
}
