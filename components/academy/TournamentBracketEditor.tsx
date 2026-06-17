"use client";

import { useState, type DragEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import type {
  DemoBracketState,
  DemoFinalMatch,
  DemoQfMatch,
  DemoSfMatch,
} from "@/lib/tournaments-demo";

type TournamentBracketEditorProps = {
  bracket: DemoBracketState;
  onChange: (bracket: DemoBracketState) => void;
};

const nameInputClass =
  "min-w-0 flex-1 bg-transparent text-[11.5px] font-sans outline-none placeholder:text-muted2 border border-transparent rounded px-1 py-0.5 -mx-1 focus:border-brand/40 focus:bg-white/80";

const scoreInputClass =
  "w-7 bg-transparent text-[11.5px] font-sans outline-none text-right border border-transparent rounded px-0.5 focus:border-brand/40 focus:bg-white/80";

function stopRowClick(event: MouseEvent | DragEvent) {
  event.stopPropagation();
}

function DragHandle({ value, label, dark = false }: { value: string; label: string; dark?: boolean }) {
  const trimmed = value.trim();

  function handleDragStart(event: DragEvent<HTMLButtonElement>) {
    if (!trimmed) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData("text/plain", trimmed);
    event.dataTransfer.effectAllowed = "copy";
  }

  return (
    <button
      type="button"
      draggable={Boolean(trimmed)}
      onDragStart={handleDragStart}
      onMouseDown={stopRowClick}
      onClick={stopRowClick}
      disabled={!trimmed}
      aria-label={trimmed ? `Drag ${trimmed} to next round` : `Drag handle for ${label}`}
      title={trimmed ? `Drag ${trimmed} to next round` : "Enter a name to drag"}
      className={`shrink-0 w-4 text-[10px] leading-none cursor-grab active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-30 hover:opacity-80 ${
        dark ? "text-white/50 hover:text-white/80" : "text-muted2 hover:text-muted"
      }`}
    >
      ⋮⋮
    </button>
  );
}

function BracketDropInput({
  value,
  onChange,
  placeholder,
  className = "",
  dark = false,
  isWinner = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  dark?: boolean;
  isWinner?: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);

  function handleDragOver(event: DragEvent<HTMLInputElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  }

  function handleDrop(event: DragEvent<HTMLInputElement>) {
    event.preventDefault();
    const text = event.dataTransfer.getData("text/plain").trim();
    if (text) onChange(text);
    setDragOver(false);
  }

  const toneClass = isWinner
    ? dark
      ? "font-semibold text-white"
      : "font-semibold text-ink"
    : dark
      ? "text-[#A9B5D1]"
      : "text-muted";

  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onMouseDown={stopRowClick}
      onClick={stopRowClick}
      className={`${nameInputClass} ${toneClass} ${dark ? "placeholder:text-white/40 focus:bg-white/10" : ""} ${
        dragOver ? "border-brand bg-brand/5 ring-1 ring-brand/30" : ""
      } ${className}`}
    />
  );
}

type WinnerRowProps = {
  isWinner: boolean;
  onSelectWinner: () => void;
  label: string;
  dark?: boolean;
  borderBottom?: boolean;
  children: ReactNode;
};

function WinnerRow({
  isWinner,
  onSelectWinner,
  label,
  dark = false,
  borderBottom = false,
  children,
}: WinnerRowProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectWinner();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isWinner}
      aria-label={`${label}${isWinner ? " — winner" : ""}`}
      onClick={onSelectWinner}
      onKeyDown={handleKeyDown}
      className={`flex items-center gap-1 px-1.5 py-1.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
        borderBottom ? (dark ? "border-b border-white/12" : "border-b border-line2") : ""
      } ${
        isWinner
          ? dark
            ? "bg-white/8"
            : "bg-brand-soft/40"
          : dark
            ? "hover:bg-white/5"
            : "hover:bg-surface/60"
      }`}
    >
      {children}
    </div>
  );
}

export function TournamentBracketEditor({ bracket, onChange }: TournamentBracketEditorProps) {
  const { qfMatches, sfMatches, finalMatch } = bracket;

  function updateQf(index: number, patch: Partial<DemoQfMatch>) {
    onChange({
      ...bracket,
      qfMatches: qfMatches.map((match, i) => (i === index ? { ...match, ...patch } : match)),
    });
  }

  function updateSf(index: number, patch: Partial<DemoSfMatch>) {
    onChange({
      ...bracket,
      sfMatches: sfMatches.map((match, i) => (i === index ? { ...match, ...patch } : match)),
    });
  }

  function updateFinal(patch: Partial<DemoFinalMatch>) {
    onChange({
      ...bracket,
      finalMatch: { ...finalMatch, ...patch },
    });
  }

  return (
    <div className="overflow-x-auto -mx-1 px-1 mt-[18px]">
      <p className="text-[10.5px] text-muted mb-3">
        Edit names and scores inline. Click a player row to mark the winner. Drag{" "}
        <span className="font-mono text-[10px]">⋮⋮</span> from a player into the next round to
        fill that slot.
      </p>
      <div className="flex items-stretch gap-0 text-[11.5px] min-w-[520px]">
        <div className="flex flex-col justify-around gap-3.5 flex-1">
          {qfMatches.map((match, index) => (
            <div
              key={`qf-${index}`}
              className="bg-card border border-line rounded-(--radius) overflow-hidden"
            >
              <WinnerRow
                isWinner={match.winner === "top"}
                onSelectWinner={() => updateQf(index, { winner: "top" })}
                label={`QF ${index + 1} top player`}
                borderBottom
              >
                <DragHandle value={match.top} label={`QF ${index + 1} top`} />
                <BracketDropInput
                  value={match.top}
                  onChange={(top) => updateQf(index, { top })}
                  placeholder="Player A"
                  isWinner={match.winner === "top"}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={match.topScore}
                  onChange={(event) => updateQf(index, { topScore: event.target.value })}
                  onMouseDown={stopRowClick}
                  onClick={stopRowClick}
                  className={`${scoreInputClass} text-muted`}
                  aria-label={`QF ${index + 1} top score`}
                />
              </WinnerRow>
              <WinnerRow
                isWinner={match.winner === "bottom"}
                onSelectWinner={() => updateQf(index, { winner: "bottom" })}
                label={`QF ${index + 1} bottom player`}
              >
                <DragHandle value={match.bottom} label={`QF ${index + 1} bottom`} />
                <BracketDropInput
                  value={match.bottom}
                  onChange={(bottom) => updateQf(index, { bottom })}
                  placeholder="Player B"
                  isWinner={match.winner === "bottom"}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={match.bottomScore}
                  onChange={(event) => updateQf(index, { bottomScore: event.target.value })}
                  onMouseDown={stopRowClick}
                  onClick={stopRowClick}
                  className={`${scoreInputClass} text-muted`}
                  aria-label={`QF ${index + 1} bottom score`}
                />
              </WinnerRow>
            </div>
          ))}
        </div>

        <div className="w-[26px] flex flex-col justify-around">
          <div className="h-0.5 bg-line my-[30px]" />
          <div className="h-0.5 bg-line my-[30px]" />
        </div>

        <div className="flex flex-col justify-around flex-1 gap-3.5">
          {sfMatches.map((match, index) => {
            const isLive = match.status === "live";
            return (
              <div
                key={match.id}
                className={`bg-card border rounded-(--radius) overflow-hidden ${
                  isLive ? "border-brand" : "border-line"
                }`}
              >
                <WinnerRow
                  isWinner={match.winner === "a"}
                  onSelectWinner={() => updateSf(index, { winner: "a" })}
                  label={`SF ${index + 1} player A`}
                  borderBottom
                >
                  <DragHandle value={match.playerAName} label={`SF ${index + 1} player A`} />
                  <BracketDropInput
                    value={match.playerAName}
                    onChange={(playerAName) => updateSf(index, { playerAName })}
                    placeholder="Semi-finalist A"
                    isWinner={match.winner === "a"}
                  />
                  {isLive ? <span className="text-brand font-bold shrink-0 pr-1">live</span> : null}
                </WinnerRow>
                <WinnerRow
                  isWinner={match.winner === "b"}
                  onSelectWinner={() => updateSf(index, { winner: "b" })}
                  label={`SF ${index + 1} player B`}
                >
                  <DragHandle value={match.playerBName} label={`SF ${index + 1} player B`} />
                  <BracketDropInput
                    value={match.playerBName}
                    onChange={(playerBName) => updateSf(index, { playerBName })}
                    placeholder="Semi-finalist B"
                    isWinner={match.winner === "b"}
                  />
                </WinnerRow>
              </div>
            );
          })}
        </div>

        <div className="w-[26px] flex items-center">
          <div className="h-0.5 bg-line w-full" />
        </div>

        <div className="flex flex-col justify-center flex-1">
          <div className="bg-ink border-none rounded-(--radius) overflow-hidden text-white">
            <WinnerRow
              isWinner={finalMatch.winner === "a"}
              onSelectWinner={() => updateFinal({ winner: "a" })}
              label="Final player A"
              dark
              borderBottom
            >
              <DragHandle value={finalMatch.playerAName} label="Final player A" dark />
              <BracketDropInput
                value={finalMatch.playerAName}
                onChange={(playerAName) => updateFinal({ playerAName })}
                placeholder="Finalist A"
                dark
                isWinner={finalMatch.winner === "a"}
              />
            </WinnerRow>
            <WinnerRow
              isWinner={finalMatch.winner === "b"}
              onSelectWinner={() => updateFinal({ winner: "b" })}
              label="Final player B"
              dark
            >
              <DragHandle value={finalMatch.playerBName} label="Final player B" dark />
              <BracketDropInput
                value={finalMatch.playerBName}
                onChange={(playerBName) => updateFinal({ playerBName })}
                placeholder="Finalist B"
                dark
                isWinner={finalMatch.winner === "b"}
              />
            </WinnerRow>
          </div>
          <div className="text-center mt-2.5 text-muted text-[10.5px]">
            FINAL
            {finalMatch.matLabel ? (
              <>
                {" · "}
                <input
                  type="text"
                  value={finalMatch.matLabel}
                  onChange={(event) => updateFinal({ matLabel: event.target.value })}
                  className="bg-transparent border-b border-dashed border-line2 text-[10.5px] text-muted outline-none focus:border-brand w-[88px] text-center"
                  aria-label="Final mat label"
                />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
