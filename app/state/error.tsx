"use client";

type StateErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function StateError({ error, reset }: StateErrorProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-0 px-6 py-12 text-center">
      <h2 className="text-lg font-bold text-ink">Could not load this page</h2>
      <p className="text-[13px] text-muted mt-2 max-w-md">
        {error.message || "Something went wrong while loading state portal data."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 min-h-[44px] px-5 rounded-[10px] bg-brand text-white text-[13px] font-semibold"
      >
        Try again
      </button>
    </div>
  );
}
