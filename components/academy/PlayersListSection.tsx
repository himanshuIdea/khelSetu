"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, UsersIcon } from "@/components/academy/icons";
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
import {
  buildPlayerFilterOptions,
  DEFAULT_PLAYER_FILTERS,
  filterPlayers,
  type PlayerFilters,
  type PlayerFormOptions,
} from "@/lib/players";
import type { Player } from "@/lib/repositories/types";

type FilterOption<T extends string> = {
  value: T;
  label: string;
};

type FilterMenuKey = "sport" | "batch" | "fees" | "status";

type MenuPosition = {
  top: number;
  left: number;
};

const MENU_GAP = 6;

type PlayersListSectionProps = {
  players: Player[];
  formOptions: PlayerFormOptions;
  selectedPlayerId?: string | null;
  onSelectPlayer?: (playerId: string) => void;
};

const TABLE_HEADERS = ["Player", "Sport · Batch", "Fees", "Attendance", "Status"] as const;

const DESKTOP_TABLE_COLUMN_CLASSES = [
  "w-[36%]",
  "w-[28%]",
  "w-[16%]",
  "w-[10%]",
  "w-[10%]",
] as const;

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 opacity-70 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function FilterPillMenu<T extends string>({
  label,
  active,
  options,
  value,
  onChange,
  open,
  onOpenChange,
}: {
  label: string;
  active: boolean;
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const button = buttonRef.current;
    const menu = menuRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuHeight = menu?.offsetHeight ?? options.length * 40 + 8;
    const menuWidth = menu?.offsetWidth ?? rect.width;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < menuHeight + MENU_GAP;

    setPosition({
      top: openUpward ? rect.top - menuHeight - MENU_GAP : rect.bottom + MENU_GAP,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8)),
    });
  }, [options.length]);

  useEffect(() => {
    if (!open) return;

    updatePosition();

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      onOpenChange(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, onOpenChange, updatePosition]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  function handleSelect(nextValue: T) {
    onChange(nextValue);
    onOpenChange(false);
  }

  const menu = open ? (
    <div
      ref={menuRef}
      role="menu"
      style={{ top: position.top, left: position.left, minWidth: buttonRef.current?.offsetWidth }}
      className="fixed z-50 min-w-[148px] bg-white border border-line rounded-[11px] shadow-card py-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="menuitemradio"
            aria-checked={selected}
            onClick={() => handleSelect(option.value)}
            className={`w-full text-left px-3.5 py-2.5 text-[13px] flex items-center gap-2 transition-colors ${
              selected ? "bg-brand-soft text-brand-d font-medium" : "text-text hover:bg-surface"
            }`}
          >
            <span className="flex-1 min-w-0 truncate">{option.label}</span>
            {selected ? <CheckIcon className="w-3 h-3 shrink-0" /> : null}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="inline-flex shrink-0 items-center min-h-[44px]"
      >
        <Pill variant={active ? "brand" : "grey"} className="px-[13px] py-2 gap-1.5">
          {label}
          <ChevronDownIcon open={open} />
        </Pill>
      </button>

      {mounted && menu ? createPortal(menu, document.body) : null}
    </>
  );
}

function PlayerMobileCard({
  player,
  highlighted,
  onSelect,
}: {
  player: Player;
  highlighted: boolean;
  onSelect?: () => void;
}) {
  return (
    <AcademyCardListItem highlighted={highlighted} onClick={onSelect}>
      <div className="flex items-start gap-3 min-w-0">
        <Avatar initials={player.initials} color={player.avatarColor} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[13px] text-ink truncate">{player.name}</div>
          <div className="text-[11px] text-muted truncate">
            {player.id} · {player.age}
          </div>
          <div className="text-[11px] text-muted truncate mt-0.5">
            {player.sport} · {player.batch}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <Pill variant={player.feesVariant}>{player.fees}</Pill>
            <Pill variant={player.statusVariant}>
              <span
                className="w-[7px] h-[7px] rounded-full shrink-0"
                style={{
                  background: player.statusVariant === "green" ? "#12B886" : "#F5A623",
                }}
              />
              {player.status}
            </Pill>
            <span className="text-[12px] text-text">
              <span className="text-muted">Attendance </span>
              <b>{player.attendance}</b>
            </span>
          </div>
        </div>
      </div>
    </AcademyCardListItem>
  );
}

export function PlayersListSection({
  players,
  formOptions,
  selectedPlayerId = null,
  onSelectPlayer,
}: PlayersListSectionProps) {
  const filterOptions = useMemo(() => buildPlayerFilterOptions(formOptions), [formOptions]);
  const [filters, setFilters] = useState<PlayerFilters>(DEFAULT_PLAYER_FILTERS);
  const [openFilterMenu, setOpenFilterMenu] = useState<FilterMenuKey | null>(null);

  const filteredPlayers = useMemo(
    () => filterPlayers(players, filters),
    [players, filters]
  );

  const activeSport = filterOptions.sports.find((option) => option.value === filters.sport);
  const activeBatch = filterOptions.batches.find((option) => option.value === filters.batch);
  const activeFees = filterOptions.fees.find((option) => option.value === filters.fees);
  const activeStatus = filterOptions.status.find((option) => option.value === filters.status);

  return (
    <div className="flex flex-col min-w-0 w-full">
      <FilterPills>
        <FilterPillMenu
          label={activeSport?.label ?? "All sports"}
          active={filters.sport !== "all"}
          options={filterOptions.sports}
          value={filters.sport}
          onChange={(sport) => setFilters((prev) => ({ ...prev, sport }))}
          open={openFilterMenu === "sport"}
          onOpenChange={(isOpen) => setOpenFilterMenu(isOpen ? "sport" : null)}
        />
        <FilterPillMenu
          label={activeBatch?.label ?? "Batch: All"}
          active={filters.batch !== "all"}
          options={filterOptions.batches}
          value={filters.batch}
          onChange={(batch) => setFilters((prev) => ({ ...prev, batch }))}
          open={openFilterMenu === "batch"}
          onOpenChange={(isOpen) => setOpenFilterMenu(isOpen ? "batch" : null)}
        />
        <FilterPillMenu
          label={activeFees?.label ?? "Fees: All"}
          active={filters.fees !== "all"}
          options={filterOptions.fees}
          value={filters.fees}
          onChange={(fees) => setFilters((prev) => ({ ...prev, fees }))}
          open={openFilterMenu === "fees"}
          onOpenChange={(isOpen) => setOpenFilterMenu(isOpen ? "fees" : null)}
        />
        <FilterPillMenu
          label={activeStatus?.label ?? "Status: All"}
          active={filters.status !== "all"}
          options={filterOptions.status}
          value={filters.status}
          onChange={(status) => setFilters((prev) => ({ ...prev, status }))}
          open={openFilterMenu === "status"}
          onOpenChange={(isOpen) => setOpenFilterMenu(isOpen ? "status" : null)}
        />
      </FilterPills>

      {players.length === 0 ? (
        <EmptyState
          className="w-full min-w-0"
          icon={<UsersIcon className="w-5 h-5" />}
          title="No players yet"
          description="Add your first athlete to start tracking batches, fees, attendance and performance."
        />
      ) : filteredPlayers.length === 0 ? (
        <EmptyState
          compact
          className="w-full min-w-0"
          title="No players match these filters"
          description="Try a different sport, batch, fee status or player status."
        />
      ) : (
        <>
          <AcademyCardList>
            {filteredPlayers.map((player) => (
              <PlayerMobileCard
                key={player.id}
                player={player}
                highlighted={selectedPlayerId === player.id}
                onSelect={onSelectPlayer ? () => onSelectPlayer(player.id) : undefined}
              />
            ))}
          </AcademyCardList>

          <AcademyTable
            className="hidden lg:block"
            headers={[...TABLE_HEADERS]}
            columnWidths={["36%", "28%", "16%", "10%", "10%"]}
            columnClassNames={[...DESKTOP_TABLE_COLUMN_CLASSES]}
          >
            {filteredPlayers.map((player) => (
              <TableRow
                key={player.id}
                highlighted={selectedPlayerId === player.id}
                onClick={onSelectPlayer ? () => onSelectPlayer(player.id) : undefined}
              >
                <TableCell className={DESKTOP_TABLE_COLUMN_CLASSES[0]}>
                  <div className="flex items-center min-w-0 gap-[11px]">
                    <Avatar initials={player.initials} color={player.avatarColor} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[13px] text-ink truncate">{player.name}</div>
                      <div className="text-[11px] text-muted truncate">
                        {player.id} · {player.age}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className={DESKTOP_TABLE_COLUMN_CLASSES[1]}>
                  <div className="truncate">{player.sport} · {player.weight}</div>
                  <div className="text-[11px] text-muted truncate">{player.batch}</div>
                </TableCell>
                <TableCell className={`whitespace-nowrap ${DESKTOP_TABLE_COLUMN_CLASSES[2]}`}>
                  <Pill variant={player.feesVariant}>{player.fees}</Pill>
                </TableCell>
                <TableCell className={`whitespace-nowrap ${DESKTOP_TABLE_COLUMN_CLASSES[3]}`}>
                  <b>{player.attendance}</b>
                </TableCell>
                <TableCell className={`whitespace-nowrap ${DESKTOP_TABLE_COLUMN_CLASSES[4]}`}>
                  <Pill variant={player.statusVariant}>
                    <span
                      className="w-[7px] h-[7px] rounded-full shrink-0"
                      style={{
                        background: player.statusVariant === "green" ? "#12B886" : "#F5A623",
                      }}
                    />
                    {player.status}
                  </Pill>
                </TableCell>
              </TableRow>
            ))}
          </AcademyTable>
        </>
      )}
    </div>
  );
}
