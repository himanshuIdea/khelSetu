"use client";

import { useEffect, useRef, useState } from "react";

type StateLoadMoreFooterProps = {
  loaded: number;
  total: number;
  entityLabel: string;
  loading: boolean;
  disabled: boolean;
  scrollRootRef: React.RefObject<HTMLDivElement | null>;
  onLoadMore: () => void;
};

export function StateLoadMoreFooter({
  loaded,
  total,
  entityLabel,
  loading,
  disabled,
  scrollRootRef,
  onLoadMore,
}: StateLoadMoreFooterProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [endVisible, setEndVisible] = useState(false);
  const remaining = total - loaded;

  useEffect(() => {
    const root = scrollRootRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setEndVisible(entry.isIntersecting),
      { root, threshold: 0, rootMargin: "0px 0px 48px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [scrollRootRef, loaded, total]);

  return (
    <div
      ref={sentinelRef}
      className="border-t border-line2 bg-linear-to-b from-transparent to-surface/50"
    >
      <div
        className={`flex flex-col items-center gap-2.5 px-4 py-5 transition-all duration-300 ease-out ${
          endVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-1 pointer-events-none"
        }`}
      >
        <p className="text-[11.5px] text-muted text-center">
          Showing {loaded.toLocaleString("en-IN")} of {total.toLocaleString("en-IN")} {entityLabel}
          {remaining > 0 ? ` · ${remaining.toLocaleString("en-IN")} more` : ""}
        </p>
        <button
          type="button"
          onClick={onLoadMore}
          disabled={disabled || loading}
          className="inline-flex items-center justify-center gap-2 min-w-[200px] rounded-[10px] border border-line2 bg-card px-5 py-2.5 text-[13px] font-semibold text-ink shadow-sm transition-colors hover:border-brand/35 hover:bg-brand-soft/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-muted2 border-t-brand animate-spin"
                aria-hidden
              />
              Loading {entityLabel}…
            </>
          ) : (
            <>Load more {entityLabel}</>
          )}
        </button>
      </div>
    </div>
  );
}
