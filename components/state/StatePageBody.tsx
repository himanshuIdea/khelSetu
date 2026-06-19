import { stateLayout } from "@/lib/state-layout";

type StatePageBodyProps = {
  children: React.ReactNode;
  variant?: "scroll" | "list";
  className?: string;
};

export function StatePageBody({
  children,
  variant = "scroll",
  className = "",
}: StatePageBodyProps) {
  const baseClass =
    variant === "list" ? stateLayout.pageBodyList : stateLayout.pageBodyScroll;

  return <div className={`${baseClass} ${className}`.trim()}>{children}</div>;
}
