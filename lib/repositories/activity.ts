import { activityEvents } from "@/db/schema";
import { db } from "@/lib/db";

export type ActivityEventType = "player_enrolled" | "fee_paid" | "attendance_marked";

export type ActivityIconType = "check" | "video" | "users";

type RecordActivityEventInput = {
  academyId: string;
  eventType: ActivityEventType;
  actorName: string;
  description: string;
  metadata?: {
    type?: ActivityIconType;
    prefix?: boolean;
  };
};

export async function recordActivityEvent(input: RecordActivityEventInput) {
  const iconType: ActivityIconType =
    input.metadata?.type ??
    (input.eventType === "player_enrolled"
      ? "users"
      : input.eventType === "fee_paid"
        ? "check"
        : "check");

  await db.insert(activityEvents).values({
    academyId: input.academyId,
    eventType: input.eventType,
    actorName: input.actorName,
    description: input.description,
    metadata: {
      type: iconType,
      prefix: input.metadata?.prefix ?? false,
    },
  });
}
