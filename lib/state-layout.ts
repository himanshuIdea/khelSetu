/** Shared layout classes for `/state/*` portal screens. */
export const stateLayout = {
  pageBodyScroll:
    "flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-[26px] lg:py-6",
  pageBodyList:
    "flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-[26px] lg:py-6",
  listWorkspace: "flex flex-1 flex-col min-h-0 min-w-0",
  listChrome: "shrink-0",
  listScrollRegion: "flex-1 min-h-0 min-w-0 flex flex-col",
} as const;
