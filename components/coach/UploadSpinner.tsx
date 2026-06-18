type UploadSpinnerProps = {
  className?: string;
  label?: string;
};

export function UploadSpinner({
  className = "w-10 h-10 border-[3px] border-white/30 border-t-white",
  label = "Uploading video",
}: UploadSpinnerProps) {
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-ink/55"
      aria-busy="true"
      aria-label={label}
    >
      <span className={`rounded-full animate-spin shrink-0 ${className}`} aria-hidden />
      <span className="text-[12.5px] font-semibold text-white">{label}</span>
    </div>
  );
}
