type WavyUnderlineProps = {
  className?: string;
  color?: string;
};

export function WavyUnderline({
  className = "w-full h-[6px] mt-1",
  color = "currentColor",
}: WavyUnderlineProps) {
  return (
    <svg
      viewBox="0 0 200 8"
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <path
        d="M0 4 Q 12.5 0, 25 4 T 50 4 T 75 4 T 100 4 T 125 4 T 150 4 T 175 4 T 200 4"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
