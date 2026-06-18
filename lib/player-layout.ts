/** Shared spacing and layout classes for `/player/*` mobile screens. */
export const playerLayout = {
  pageX: "px-4 sm:px-[18px]",
  header: "shrink-0 pt-3 pb-3 min-w-0",
  headerRow: "flex items-center gap-3 min-w-0",
  title: "text-[17px] font-bold text-ink tracking-tight min-w-0 truncate",
  brandTitle: "text-[20px] sm:text-[21px] font-bold text-ink tracking-[-0.4px] shrink-0",
  iconButton:
    "inline-flex items-center justify-center w-11 h-11 min-h-[44px] min-w-[44px] rounded-[11px] bg-card border border-line text-muted shrink-0 transition-colors hover:bg-surface",
  searchShell:
    "flex items-center gap-2.5 min-h-[44px] bg-card border border-line rounded-[11px] px-3.5 py-2.5 text-muted2 min-w-0",
  body: "flex flex-1 flex-col min-h-0 min-w-0 w-full max-w-full overflow-x-clip",
  scrollBody:
    "flex flex-1 flex-col min-h-0 min-w-0 w-full max-w-full overflow-x-clip overflow-y-auto overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch] px-4 sm:px-[18px] pb-4 sm:pb-5",
  centeredPanel: "flex flex-1 flex-col items-center justify-center min-h-0 min-w-0 px-4 sm:px-6 py-6 text-center",
  card: "bg-card border border-line rounded-[18px] min-w-0",
  cardLg: "bg-card border border-line rounded-[20px] min-w-0",
} as const;

export function playerHeaderClassName(extra = "") {
  return `${playerLayout.header} ${playerLayout.pageX} ${extra}`.trim();
}

export function playerScrollBodyClassName(extra = "") {
  return `${playerLayout.scrollBody} ${extra}`.trim();
}
