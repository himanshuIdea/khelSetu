"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BellIcon, CheckIcon, VideoIcon } from "@/components/academy/icons";
import { PlayerEmptyState } from "@/components/player/PlayerEmptyState";
import { PlayerScrollBody } from "@/components/player/PlayerScrollBody";
import { api } from "@/lib/api";
import { playerLayout } from "@/lib/player-layout";
import { playerNotificationsRoute } from "@/lib/player-nav";
import {
  countUnreadPlayerNotifications,
  playerNotificationSeenStorageKey,
  type PlayerNotification,
} from "@/lib/player-notifications-types";

type PlayerNotificationBellProps = {
  academyId: string;
  playerId: string;
  initialItems?: PlayerNotification[];
};

function readSeenAt(playerId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(playerNotificationSeenStorageKey(playerId));
  } catch {
    return null;
  }
}

export function PlayerNotificationBell({
  academyId,
  playerId,
  initialItems = [],
}: PlayerNotificationBellProps) {
  const [items, setItems] = useState<PlayerNotification[]>(initialItems);
  const [seenAt, setSeenAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await api.player.notifications.list(academyId);
      setItems(response.items);
    } catch {
      // Keep initial items on failure.
    }
  }, [academyId]);

  useEffect(() => {
    setSeenAt(readSeenAt(playerId));
    void refresh();
  }, [playerId, refresh]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === playerNotificationSeenStorageKey(playerId)) {
        setSeenAt(event.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [playerId]);

  const unreadCount = countUnreadPlayerNotifications(items, seenAt);

  return (
    <Link
      href={playerNotificationsRoute}
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : "Notifications"
      }
      className={`${playerLayout.iconButton} relative text-muted`}
    >
      <BellIcon />
      {unreadCount > 0 ? (
        <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#F4F6FA]">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}

type PlayerNotificationsListProps = {
  items: PlayerNotification[];
  playerId: string;
};

function NotificationIcon({ kind }: { kind: PlayerNotification["kind"] }) {
  if (kind === "review") {
    return (
      <span className="w-10 h-10 rounded-xl bg-green-soft text-[#0E9B72] flex items-center justify-center shrink-0">
        <CheckIcon className="w-5 h-5" />
      </span>
    );
  }
  return (
    <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
      <VideoIcon className="w-5 h-5" />
    </span>
  );
}

export function PlayerNotificationsList({ items, playerId }: PlayerNotificationsListProps) {
  useEffect(() => {
    try {
      window.localStorage.setItem(
        playerNotificationSeenStorageKey(playerId),
        new Date().toISOString()
      );
    } catch {
      // Ignore private browsing / quota errors.
    }
  }, [playerId]);

  if (items.length === 0) {
    return (
      <PlayerScrollBody>
        <PlayerEmptyState
          icon={<BellIcon className="w-5 h-5" />}
          title="You're all caught up"
          description="New drills from your coach and submission reviews will show up here."
        />
      </PlayerScrollBody>
    );
  }

  return (
    <PlayerScrollBody className="gap-2.5 pt-0">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={`${playerLayout.card} flex items-start gap-3 p-3.5 min-w-0 transition-colors hover:bg-surface`}
        >
          <NotificationIcon kind={item.kind} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-ink leading-snug">{item.title}</div>
            <div className="text-[12px] text-muted mt-0.5 leading-snug truncate">{item.subtitle}</div>
            <div className="text-[11px] text-muted2 mt-1">{item.timeAgo}</div>
          </div>
        </Link>
      ))}
    </PlayerScrollBody>
  );
}