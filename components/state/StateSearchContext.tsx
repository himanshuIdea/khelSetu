"use client";

import {
  createContext,
  useCallback,
  useContext,
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

export function useStateSearchRegistration() {
  const ctx = useStateSearch();

  return ctx;
}
