"use client";

import { Avatar } from "@/components/academy/shared";
import { formatSportWeightLine, formatWeightKg } from "@/lib/format";
import type { EligibleTournamentPlayer } from "@/lib/tournaments";

export type TournamentParticipantEmptyContext = {
  sportName: string;
  divisionLabel: string;
  weightClass?: string;
  weightClasses: string[];
  requiresWeight: boolean;
};

export function formatTournamentParticipantEmptyMessage(context: TournamentParticipantEmptyContext): string {
  const { sportName, divisionLabel, weightClass, weightClasses, requiresWeight } = context;

  if (requiresWeight && weightClass) {
    const formatted = formatWeightKg(weightClass);
    const available = weightClasses.map((weight) => formatWeightKg(weight)).join(", ");
    if (available) {
      return `No ${divisionLabel} ${sportName} athletes at ${formatted}. Try: ${available}.`;
    }
    return `No ${divisionLabel} ${sportName} athletes at ${formatted}.`;
  }

  if (weightClasses.length > 0 && requiresWeight) {
    const available = weightClasses.map((weight) => formatWeightKg(weight)).join(", ");
    return `No eligible athletes. Available weight classes: ${available}.`;
  }

  return `No eligible ${divisionLabel} ${sportName} athletes for the selected filters.`;
}

type TournamentParticipantPickerListProps = {
  players: EligibleTournamentPlayer[];
  selectedIds: Set<string>;
  onToggle: (playerId: string) => void;
  isLoading?: boolean;
  filtersReady?: boolean;
  emptyContext?: TournamentParticipantEmptyContext;
  showAcademy?: boolean;
  filtersHint?: string;
};

export function TournamentParticipantPickerList({
  players,
  selectedIds,
  onToggle,
  isLoading = false,
  filtersReady = true,
  emptyContext,
  showAcademy = false,
  filtersHint = "Choose sport, age division, and weight class to load athletes.",
}: TournamentParticipantPickerListProps) {
  if (!filtersReady) {
    return (
      <p className="text-[13px] text-muted bg-surface border border-line2 rounded-[10px] px-4 py-3">
        {filtersHint}
      </p>
    );
  }

  if (isLoading) {
    return <p className="text-[13px] text-muted">Loading eligible players…</p>;
  }

  if (players.length === 0) {
    return (
      <p className="text-[13px] text-muted bg-surface border border-line2 rounded-[10px] px-4 py-3">
        {emptyContext
          ? formatTournamentParticipantEmptyMessage(emptyContext)
          : "No eligible players match the selected filters."}
      </p>
    );
  }

  return (
    <div className="border border-line rounded-[10px] divide-y divide-line2 max-h-[min(280px,40vh)] overflow-y-auto">
      {players.map((player) => {
        const checked = selectedIds.has(player.id);
        return (
          <label
            key={player.id}
            className={`flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-colors ${
              checked ? "bg-brand-soft/40" : "hover:bg-surface/80"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(player.id)}
              className="w-4 h-4 rounded border-line accent-brand shrink-0"
            />
            <Avatar initials={player.initials || player.name.slice(0, 2)} color={player.avatarColor} size="sm" />
            <div className="flex-1 min-w-0 text-left">
              <div className="font-semibold text-[13px] text-ink truncate">{player.name}</div>
              <div className="text-[11.5px] text-muted truncate">
                {showAcademy ? `${player.academyName} · ` : ""}
                {player.batch} · {formatSportWeightLine(`${player.sport} · ${player.weight}`)} ·{" "}
                {player.rating} rating
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}

type SelectedParticipantChipsProps = {
  participants: EligibleTournamentPlayer[];
  maxVisible?: number;
};

export function SelectedParticipantChips({
  participants,
  maxVisible = 4,
}: SelectedParticipantChipsProps) {
  if (participants.length === 0) return null;

  const visible = participants.slice(0, maxVisible);
  const overflow = participants.length - visible.length;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mb-2">
      {visible.map((player) => (
        <span
          key={player.id}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-brand-soft/50 text-[11.5px] font-medium text-ink"
        >
          <Avatar initials={player.initials || player.name.slice(0, 2)} color={player.avatarColor} size="sm" />
          <span className="truncate max-w-[120px]">{player.name}</span>
        </span>
      ))}
      {overflow > 0 ? (
        <span className="text-[11.5px] font-semibold text-muted">+{overflow} more</span>
      ) : null}
    </div>
  );
}
