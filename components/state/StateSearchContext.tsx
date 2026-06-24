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

type StateSearchContextValue = {
  query: string;
  setQuery: (query: string) => void;
  enabled: boolean;
  register: () => () => void;
};

const StateSearchContext = createContext<StateSearchContextValue | null>(null);

export function StateSearchProvider({ children }: { children: ReactNode }) {
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
    <StateSearchContext.Provider value={value}>{children}</StateSearchContext.Provider>
  );
}

export function useStateSearch() {
  return useContext(StateSearchContext);
}

/** Registers this page for top-bar search and returns the current query. */
export function useStatePageSearch(): string {
  const ctx = useStateSearch();

  useEffect(() => {
    if (!ctx) return;
    return ctx.register();
  }, [ctx?.register]);

  return ctx?.query ?? "";
}
