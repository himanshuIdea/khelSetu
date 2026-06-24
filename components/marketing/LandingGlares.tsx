const ORANGE_GLOW =
  "radial-gradient(circle, rgba(255,107,44,0.32), transparent 70%)";

const BLUE_GLOW =
  "radial-gradient(circle, rgba(47,107,255,0.24), transparent 70%)";

function Glare({
  className,
  style,
  gradient,
}: {
  className?: string;
  style?: React.CSSProperties;
  gradient: string;
}) {
  return (
    <div
      className={`absolute rounded-full pointer-events-none ${className ?? ""}`}
      style={{ background: gradient, ...style }}
    />
  );
}

/** Orange top-right + blue bottom-left ambient glares for portal landings. */
export function LandingGlares() {
  return (
    <>
      <Glare
        gradient={ORANGE_GLOW}
        className="w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] lg:w-[480px] lg:h-[480px]"
        style={{ right: "-18%", top: "-12%" }}
      />
      <Glare
        gradient={BLUE_GLOW}
        className="w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] lg:w-[420px] lg:h-[420px]"
        style={{ left: "-14%", bottom: "-10%" }}
      />
    </>
  );
}
