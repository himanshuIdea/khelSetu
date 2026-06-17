type PlayerScreenProps = {
  children: React.ReactNode;
  className?: string;
};

/** Page root for `/player/*` — flex column that fills the app shell main area. */
export function PlayerScreen({ children, className = "" }: PlayerScreenProps) {
  return (
    <div className={`flex flex-col flex-1 min-h-0 min-w-0 ${className}`.trim()}>
      {children}
    </div>
  );
}
