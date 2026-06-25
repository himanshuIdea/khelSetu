"use client";

import { useEffect, useRef, useState } from "react";

type UseNearViewportOptions = {
  rootMargin?: string;
  enabled?: boolean;
};

/** True when the element intersects the viewport (with optional margin). */
export function useNearViewport({
  rootMargin = "200px",
  enabled = true,
}: UseNearViewportOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setNear(false);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { rootMargin, threshold: 0 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, rootMargin]);

  return { ref, near };
}
