"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function usePortalLogout(loginPath: string) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await api.auth.logout();
    } catch {
      // Continue to login even if logout fails.
    }
    router.replace(loginPath);
  }, [loggingOut, loginPath, router]);

  return { logout, loggingOut };
}
