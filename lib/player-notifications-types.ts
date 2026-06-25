export type PlayerNotification =
  | {
      kind: "new_drill";
      id: string;
      drillPostId: string;
      title: string;
      subtitle: string;
      at: string;
      timeAgo: string;
      href: string;
    }
  | {
      kind: "review";
      id: string;
      drillPostId: string;
      title: string;
      subtitle: string;
      rating: number;
      at: string;
      timeAgo: string;
      href: string;
    };

export function countUnreadPlayerNotifications(
  items: PlayerNotification[],
  seenAt: string | null
): number {
  if (!seenAt) {
    return items.length;
  }
  const watermark = new Date(seenAt).getTime();
  if (!Number.isFinite(watermark)) {
    return items.length;
  }
  return items.filter((item) => new Date(item.at).getTime() > watermark).length;
}

export function playerNotificationSeenStorageKey(playerId: string): string {
  return `khel_player_notif_seen_at_${playerId}`;
}
