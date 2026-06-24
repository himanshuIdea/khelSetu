"use client";

import { useCallback, useState } from "react";

export function useStateSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false);

  const toggle = useCallback(() => {
    setCollapsed((current) => !current);
  }, []);

  return { collapsed, toggle };
}
