"use client";

type RatingFilterSliderProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
};

export function RatingFilterSlider({
  value,
  onChange,
  min = 5,
  max = 10,
  step = 0.1,
  className = "",
}: RatingFilterSliderProps) {
  return (
    <div
      className={`inline-flex items-center gap-2.5 shrink-0 bg-card border border-line rounded-full px-[13px] py-2 min-h-[36px] ${className}`}
    >
      <span className="text-[12.5px] font-medium text-muted whitespace-nowrap">Rating ≥</span>
      <span className="text-[12.5px] font-semibold text-ink tabular-nums min-w-[2rem] text-right">
        {value.toFixed(1)}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-[88px] sm:w-[104px] accent-brand cursor-pointer"
        aria-label="Minimum KhelSetu rating"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
}

export function parseAthleteRating(rating: string): number | null {
  const value = Number.parseFloat(rating);
  return Number.isNaN(value) ? null : value;
}
