"use client";

type BrandColourFieldProps = {
  label: string;
  colors: readonly string[];
  value: string;
  onChange: (color: string) => void;
};

export function BrandColourField({ label, colors, value, onChange }: BrandColourFieldProps) {
  return (
    <div className="flex-1">
      <span className="block text-[12.5px] font-semibold text-text mb-2 mt-0.5">{label}</span>
      <div className="flex gap-[11px] mt-1 overflow-x-auto pb-1" role="radiogroup" aria-label={label}>
        {colors.map((color) => {
          const selected = value === color;
          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`Select brand colour ${color}`}
              onClick={() => onChange(color)}
              className="w-[34px] h-[34px] rounded-[9px] cursor-pointer shrink-0 transition-transform active:scale-90 touch-manipulation mt-1 ml-0 first:ml-0 last:mr-0"
              style={{
                background: color,
                boxShadow: selected ? "0 0 0 2px #fff, 0 0 0 4px var(--ink)" : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
