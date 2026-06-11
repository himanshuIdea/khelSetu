"use client";

type FundingFieldProps<T extends string> = {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
};

export function FundingField<T extends string>({
  label,
  options,
  value,
  onChange,
}: FundingFieldProps<T>) {
  return (
    <div className="flex-1">
      <span className="block text-[12.5px] font-semibold text-text mb-2">{label}</span>
      <div className="flex flex-col sm:flex-row gap-2.5" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option)}
              className={`flex-1 border rounded-[11px] px-[13px] py-[13px] text-[13px] font-semibold flex items-center gap-2 transition-all active:scale-[0.98] touch-manipulation ${
                selected
                  ? "border-brand bg-brand-soft text-brand-d shadow-[0_0_0_1px_rgba(255,107,44,0.15)]"
                  : "border-line text-muted hover:border-muted2 hover:text-text"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full shrink-0 transition-all ${
                  selected
                    ? "border-[5px] border-brand bg-white"
                    : "border-[1.5px] border-line"
                }`}
              />
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
