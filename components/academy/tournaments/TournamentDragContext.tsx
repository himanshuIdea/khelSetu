"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type TournamentDragPayload = {
  playerId: string | null;
  playerName: string;
  sourceMatchId: string;
  sourceSide: "a" | "b";
};

type TournamentDragContextValue = {
  dragPayload: TournamentDragPayload | null;
  setDragPayload: (payload: TournamentDragPayload | null) => void;
  clearDrag: () => void;
};

const TournamentDragContext = createContext<TournamentDragContextValue | null>(null);

export function TournamentDragProvider({ children }: { children: ReactNode }) {
  const [dragPayload, setDragPayload] = useState<TournamentDragPayload | null>(null);
  const clearDrag = useCallback(() => setDragPayload(null), []);

  const value = useMemo(
    () => ({ dragPayload, setDragPayload, clearDrag }),
    [dragPayload, clearDrag]
  );

  return (
    <TournamentDragContext.Provider value={value}>{children}</TournamentDragContext.Provider>
  );
}

export function useTournamentDrag() {
  const ctx = useContext(TournamentDragContext);
  if (!ctx) {
    throw new Error("useTournamentDrag must be used within TournamentDragProvider");
  }
  return ctx;
}

export function useOptionalTournamentDrag() {
  return useContext(TournamentDragContext);
}
