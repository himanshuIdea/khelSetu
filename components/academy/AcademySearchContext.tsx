"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AcademySearchContextValue = {
  query: string;
  setQuery: (query: string) => void;
  enabled: boolean;
  register: () => () => void;
};

const AcademySearchContext = createContext<AcademySearchContextValue | null>(null);

export function AcademySearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [registrations, setRegistrations] = useState(0);

  const register = useCallback(() => {
    setRegistrations((count) => count + 1);
    return () => setRegistrations((count) => Math.max(0, count - 1));
  }, []);

  const value = useMemo(
    () => ({
      query,
      setQuery,
      enabled: registrations > 0,
      register,
    }),
    [query, registrations, register]
  );

  return (
    <AcademySearchContext.Provider value={value}>{children}</AcademySearchContext.Provider>
  );
}

export function useAcademySearch() {
  return useContext(AcademySearchContext);
}

/** Registers this page for top-bar search and returns the current query. */
export function useAcademyPageSearch(): string {
  const ctx = useAcademySearch();

  useEffect(() => {
    if (!ctx) return;
    return ctx.register();
  }, [ctx]);

  return ctx?.query ?? "";
}
