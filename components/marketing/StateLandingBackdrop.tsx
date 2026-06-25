"use client";

import { useEffect, useRef } from "react";

const HERO_GRADIENT =
  "linear-gradient(165deg, #0B162C 0%, #0E1B33 45%, #16264A 100%)";

const ORANGE_GLOW =
  "radial-gradient(circle, rgba(255,107,44,0.32), transparent 70%)";

const BLUE_GLOW =
  "radial-gradient(circle, rgba(47,107,255,0.24), transparent 70%)";

/**
 * Fixed dark-ink backdrop with the canonical orange/blue landing glares.
 * Glares parallax on scroll (reduced-motion safe) so they drift as the
 * walkthrough sections move past — the static LandingGlares can't move.
 */
export function StateLandingBackdrop() {
  const orangeRef = useRef<HTMLDivElement>(null);
  const blueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      if (orangeRef.current) {
        orangeRef.current.style.transform = `translate3d(${y * 0.05}px, ${y * 0.16}px, 0)`;
      }
      if (blueRef.current) {
        blueRef.current.style.transform = `translate3d(${y * 0.06}px, ${y * -0.18}px, 0)`;
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      style={{ background: HERO_GRADIENT }}
      aria-hidden
    >
      <div
        ref={orangeRef}
        className="absolute rounded-full w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] lg:w-[520px] lg:h-[520px] will-change-transform"
        style={{ background: ORANGE_GLOW, right: "-12%", top: "-10%" }}
      />
      <div
        ref={blueRef}
        className="absolute rounded-full w-[360px] h-[360px] sm:w-[460px] sm:h-[460px] lg:w-[620px] lg:h-[620px] will-change-transform"
        style={{ background: BLUE_GLOW, left: "-16%", bottom: "-18%" }}
      />
    </div>
  );
}
