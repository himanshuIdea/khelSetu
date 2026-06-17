"use client";

import { useMemo, useState } from "react";
import { InlineSelect } from "@/components/academy/InlineSelect";
import {
  AcademyCardList,
  AcademyCardListItem,
  AcademyTable,
  Avatar,
  EmptyState,
  FilterPills,
  Pill,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { UsersIcon } from "@/components/academy/icons";
import type { CoachPlayerFormOptions } from "@/lib/repositories/players";
import type { Player } from "@/lib/repositories/types";

type CoachPlayerStatusFilter = "all" | "active" | "on_hold";

type CoachPlayersListSectionProps = {
  players: Player[];
  formOptions: CoachPlayerFormOptions;
  selectedPlayerId?: string | null;
  onSelectPlayer?: (playerId: string) => void;
  initialBatchId?: string;
};

const TABLE_HEADERS = ["Player", "Sport · Batch", "Attendance", "Status"] as const;

const DESKTOP_TABLE_COLUMN_CLASSES = [
  "w-[30%] min-w-0",
  "w-[25%] min-w-0",
  "w-[20%] min-w-0",
  "w-[20%] min-w-0",
] as const;

export function CoachPlayersListSection({
  players,
  formOptions,
  selectedPlayerId,
  onSelectPlayer,
  initialBatchId,
}: CoachPlayersListSectionProps) {
  const [batchId, setBatchId] = useState(initialBatchId ?? "all");
  const [status, setStatus] = useState<CoachPlayerStatusFilter>("all");

  const filtered = useMemo(() => {
    return players.filter((player) => {
      if (batchId !== "all") {
        const batch = formOptions.batches.find((b) => b.id === batchId);
        if (batch && player.batch !== batch.name) return false;
      }
      if (status === "active" && player.status !== "Active") return false;
      if (status === "on_hold" && player.status !== "On hold") return false;
      return true;
    });
  }, [players, batchId, status, formOptions.batches]);

  const batchOptions = [
    { value: "all", label: "All batches" },
    ...formOptions.batches.map((batch) => ({ value: batch.id, label: batch.name })),
  ];

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "active", label: "Active" },
    { value: "on_hold", label: "On hold" },
  ];

  if (players.length === 0) {
    return (
      <EmptyState
        icon={<UsersIcon className="w-6 h-6" />}
        title="No players in your batches"
        description="Players enrolled in your assigned batches will appear here once the academy admin assigns you."
      />
    );
  }

  return (
    <div className="min-w-0">
      <FilterPills>
        <InlineSelect
          variant="pill"
          filterPill
          aria-label="Filter by batch"
          value={batchId}
          onChange={setBatchId}
          active={batchId !== "all"}
          menuMaxHeightClass="max-h-52"
          className="shrink-0 text-[12.5px] font-medium px-[13px] py-2"
          options={batchOptions}
        />
        <InlineSelect
          variant="pill"
          filterPill
          aria-label="Filter by status"
          value={status}
          onChange={(value) => setStatus(value as CoachPlayerStatusFilter)}
          active={status !== "all"}
          className="shrink-0 text-[12.5px] font-medium px-[13px] py-2"
          options={statusOptions}
        />
      </FilterPills>

      {filtered.length === 0 ? (
        <EmptyState
          compact
          icon={<UsersIcon className="w-5 h-5" />}
          title="No players match filters"
          description="Try a different batch or status filter."
        />
      ) : (
        <>
          <AcademyCardList className="lg:hidden">
            {filtered.map((player) => (
              <AcademyCardListItem
                key={player.id}
                highlighted={selectedPlayerId === player.id}
                onClick={() => onSelectPlayer?.(player.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar initials={player.initials} color={player.avatarColor} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[13.5px] text-ink truncate">{player.name}</div>
                    <div className="text-[11.5px] text-muted truncate">
                      {player.sport} · {player.batch}
                    </div>
                  </div>
                  <Pill variant={player.statusVariant}>{player.status}</Pill>
                </div>
                <div className="mt-2 text-[11.5px] text-muted">Attendance: {player.attendance}</div>
              </AcademyCardListItem>
            ))}
          </AcademyCardList>

          <AcademyTable
            className="hidden lg:block"
            headers={[...TABLE_HEADERS]}
            columnClassNames={[...DESKTOP_TABLE_COLUMN_CLASSES]}
          >
            {filtered.map((player) => (
              <TableRow
                key={player.id}
                highlighted={selectedPlayerId === player.id}
                onClick={() => onSelectPlayer?.(player.id)}
              >
                <TableCell className={DESKTOP_TABLE_COLUMN_CLASSES[0]}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar initials={player.initials} color={player.avatarColor} size="sm" />
                    <div className="min-w-0">
                      <div className="font-semibold text-[13px] truncate">{player.name}</div>
                      <div className="text-[11px] text-muted">{player.id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className={DESKTOP_TABLE_COLUMN_CLASSES[1]}>
                  <div className="text-[12.5px] truncate">{player.sport}</div>
                  <div className="text-[11px] text-muted truncate">{player.batch}</div>
                </TableCell>
                <TableCell className={DESKTOP_TABLE_COLUMN_CLASSES[2]}>{player.attendance}</TableCell>
                <TableCell className={DESKTOP_TABLE_COLUMN_CLASSES[3]}>
                  <Pill variant={player.statusVariant}>{player.status}</Pill>
                </TableCell>
              </TableRow>
            ))}
          </AcademyTable>
        </>
      )}
    </div>
  );
}
