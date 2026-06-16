import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  academyScheduleSettings,
  academySports,
  batches,
  coaches,
  sports,
  weeklyScheduleSlotBatches,
  weeklyScheduleSlots,
} from "@/db/schema";
import { getAssignCoachFormOptions } from "@/lib/repositories/coaches";
import { parseDateOnly } from "@/lib/attendance";
import {
  formatMinutesAsTimeRange,
  isoWeekdayFromDate,
  rangesOverlap,
  localDateString,
  scheduledAtFromDateAndMinutes,
  type DayOfWeek,
  type ExpandedSlotRow,
  type ScheduleSettingsPayload,
  type SlotPayload,
  type TimetableData,
  type TimetableSlot,
  validateScheduleSettings,
  validateSlotPayload,
} from "@/lib/timetable";

async function getSettingsRow(academyId: string) {
  const [row] = await db
    .select()
    .from(academyScheduleSettings)
    .where(eq(academyScheduleSettings.academyId, academyId))
    .limit(1);
  return row ?? null;
}

async function assertSettingsConfigured(academyId: string) {
  const settings = await getSettingsRow(academyId);
  if (!settings?.isConfigured) {
    throw new Error("Set academy operating hours before adding sessions.");
  }
  return settings;
}

type SlotRow = {
  id: string;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  sportId: string;
  sportName: string;
  coachId: string;
  coachName: string;
  venue: string | null;
  batchId: string;
  batchName: string;
};

async function loadSlotRows(academyId: string, slotId?: string): Promise<SlotRow[]> {
  const conditions = [eq(weeklyScheduleSlots.academyId, academyId)];
  if (slotId) {
    conditions.push(eq(weeklyScheduleSlots.id, slotId));
  }

  return db
    .select({
      id: weeklyScheduleSlots.id,
      dayOfWeek: weeklyScheduleSlots.dayOfWeek,
      startMinutes: weeklyScheduleSlots.startMinutes,
      endMinutes: weeklyScheduleSlots.endMinutes,
      sportId: weeklyScheduleSlots.sportId,
      sportName: sports.name,
      coachId: weeklyScheduleSlots.coachId,
      coachName: coaches.fullName,
      venue: weeklyScheduleSlots.venue,
      batchId: batches.id,
      batchName: batches.name,
    })
    .from(weeklyScheduleSlots)
    .innerJoin(sports, eq(weeklyScheduleSlots.sportId, sports.id))
    .innerJoin(coaches, eq(weeklyScheduleSlots.coachId, coaches.id))
    .innerJoin(weeklyScheduleSlotBatches, eq(weeklyScheduleSlotBatches.slotId, weeklyScheduleSlots.id))
    .innerJoin(batches, eq(weeklyScheduleSlotBatches.batchId, batches.id))
    .where(and(...conditions))
    .orderBy(
      weeklyScheduleSlots.dayOfWeek,
      weeklyScheduleSlots.startMinutes,
      batches.name
    );
}

function groupSlotRows(rows: SlotRow[]): TimetableSlot[] {
  const map = new Map<string, TimetableSlot>();

  for (const row of rows) {
    const existing = map.get(row.id);
    if (existing) {
      existing.batches.push({ id: row.batchId, name: row.batchName });
      continue;
    }

    map.set(row.id, {
      id: row.id,
      dayOfWeek: row.dayOfWeek as DayOfWeek,
      startMinutes: row.startMinutes,
      endMinutes: row.endMinutes,
      sportId: row.sportId,
      sportName: row.sportName,
      coachId: row.coachId,
      coachName: row.coachName,
      venue: row.venue,
      batches: [{ id: row.batchId, name: row.batchName }],
    });
  }

  return [...map.values()];
}

async function validateSlotReferences(academyId: string, payload: SlotPayload, excludeSlotId?: string) {
  const settings = await assertSettingsConfigured(academyId);
  const baseError = validateSlotPayload(payload);
  if (baseError) throw new Error(baseError);

  if (payload.startMinutes < settings.openMinutes || payload.endMinutes > settings.closeMinutes) {
    throw new Error(
      `Session must be within academy hours (${formatMinutesAsTimeRange(settings.openMinutes, settings.closeMinutes)}).`
    );
  }

  const [sport] = await db
    .select({ id: sports.id })
    .from(academySports)
    .innerJoin(sports, eq(academySports.sportId, sports.id))
    .where(and(eq(academySports.academyId, academyId), eq(sports.id, payload.sportId)))
    .limit(1);

  if (!sport) {
    throw new Error("Selected sport is not offered by this academy.");
  }

  const [coach] = await db
    .select({ id: coaches.id, sportId: coaches.sportId })
    .from(coaches)
    .where(and(eq(coaches.academyId, academyId), eq(coaches.id, payload.coachId)))
    .limit(1);

  if (!coach) {
    throw new Error("Coach not found.");
  }

  if (coach.sportId !== payload.sportId) {
    throw new Error("Coach must teach the selected sport.");
  }

  const batchRows = await db
    .select({ id: batches.id, sportId: batches.sportId, name: batches.name })
    .from(batches)
    .where(and(eq(batches.academyId, academyId), inArray(batches.id, payload.batchIds)));

  if (batchRows.length !== payload.batchIds.length) {
    throw new Error("One or more batches are invalid for this academy.");
  }

  for (const batch of batchRows) {
    if (batch.sportId !== payload.sportId) {
      throw new Error(`Batch ${batch.name} does not belong to the selected sport.`);
    }
  }

  const existingSlots = groupSlotRows(await loadSlotRows(academyId));

  for (const slot of existingSlots) {
    if (excludeSlotId && slot.id === excludeSlotId) continue;
    if (slot.dayOfWeek !== payload.dayOfWeek) continue;
    if (!rangesOverlap(slot.startMinutes, slot.endMinutes, payload.startMinutes, payload.endMinutes)) {
      continue;
    }

    if (slot.coachId === payload.coachId) {
      throw new Error("This coach is already booked for an overlapping session on this day.");
    }

    const overlappingBatch = slot.batches.find((batch) => payload.batchIds.includes(batch.id));
    if (overlappingBatch) {
      throw new Error(
        `${overlappingBatch.name} is already scheduled for an overlapping session on this day.`
      );
    }
  }
}

export async function getTimetable(academyId: string): Promise<TimetableData> {
  const [settingsRow, slotRows, formOptions] = await Promise.all([
    getSettingsRow(academyId),
    loadSlotRows(academyId),
    getAssignCoachFormOptions(academyId),
  ]);

  return {
    settings: settingsRow
      ? {
          openMinutes: settingsRow.openMinutes,
          closeMinutes: settingsRow.closeMinutes,
          isConfigured: settingsRow.isConfigured,
        }
      : null,
    slots: groupSlotRows(slotRows),
    formOptions,
  };
}

export async function saveScheduleSettings(academyId: string, payload: ScheduleSettingsPayload) {
  const error = validateScheduleSettings(payload);
  if (error) throw new Error(error);

  const [existing] = await db
    .select({ id: academyScheduleSettings.id })
    .from(academyScheduleSettings)
    .where(eq(academyScheduleSettings.academyId, academyId))
    .limit(1);

  if (existing) {
    await db
      .update(academyScheduleSettings)
      .set({
        openMinutes: payload.openMinutes,
        closeMinutes: payload.closeMinutes,
        isConfigured: true,
        updatedAt: new Date(),
      })
      .where(eq(academyScheduleSettings.id, existing.id));
  } else {
    await db.insert(academyScheduleSettings).values({
      academyId,
      openMinutes: payload.openMinutes,
      closeMinutes: payload.closeMinutes,
      isConfigured: true,
    });
  }

  return getTimetable(academyId);
}

export async function createSlot(academyId: string, payload: SlotPayload) {
  await validateSlotReferences(academyId, payload);

  return db.transaction(async (tx) => {
    const [slot] = await tx
      .insert(weeklyScheduleSlots)
      .values({
        academyId,
        dayOfWeek: payload.dayOfWeek,
        startMinutes: payload.startMinutes,
        endMinutes: payload.endMinutes,
        sportId: payload.sportId,
        coachId: payload.coachId,
        venue: payload.venue?.trim() || null,
      })
      .returning();

    for (const batchId of payload.batchIds) {
      await tx.insert(weeklyScheduleSlotBatches).values({
        slotId: slot.id,
        batchId,
      });
    }

    return slot.id;
  }).then(async (slotId) => {
    const rows = await loadSlotRows(academyId, slotId);
    const [slot] = groupSlotRows(rows);
    if (!slot) throw new Error("Could not load created session.");
    return slot;
  });
}

export async function updateSlot(academyId: string, slotId: string, payload: SlotPayload) {
  const [existing] = await db
    .select({ id: weeklyScheduleSlots.id })
    .from(weeklyScheduleSlots)
    .where(and(eq(weeklyScheduleSlots.academyId, academyId), eq(weeklyScheduleSlots.id, slotId)))
    .limit(1);

  if (!existing) {
    throw new Error("Session not found.");
  }

  await validateSlotReferences(academyId, payload, slotId);

  return db.transaction(async (tx) => {
    await tx
      .update(weeklyScheduleSlots)
      .set({
        dayOfWeek: payload.dayOfWeek,
        startMinutes: payload.startMinutes,
        endMinutes: payload.endMinutes,
        sportId: payload.sportId,
        coachId: payload.coachId,
        venue: payload.venue?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(weeklyScheduleSlots.id, slotId));

    await tx.delete(weeklyScheduleSlotBatches).where(eq(weeklyScheduleSlotBatches.slotId, slotId));

    for (const batchId of payload.batchIds) {
      await tx.insert(weeklyScheduleSlotBatches).values({
        slotId,
        batchId,
      });
    }
  }).then(async () => {
    const rows = await loadSlotRows(academyId, slotId);
    const [slot] = groupSlotRows(rows);
    if (!slot) throw new Error("Could not load updated session.");
    return slot;
  });
}

export async function deleteSlot(academyId: string, slotId: string) {
  const result = await db
    .delete(weeklyScheduleSlots)
    .where(and(eq(weeklyScheduleSlots.academyId, academyId), eq(weeklyScheduleSlots.id, slotId)))
    .returning({ id: weeklyScheduleSlots.id });

  if (result.length === 0) {
    throw new Error("Session not found.");
  }
}

export async function expandSlotsForDate(academyId: string, date: Date): Promise<ExpandedSlotRow[]> {
  const settings = await getSettingsRow(academyId);
  if (!settings?.isConfigured) return [];

  const dayOfWeek = isoWeekdayFromDate(date);
  const dateStr = localDateString(date);
  const rows = await loadSlotRows(academyId);
  const slots = groupSlotRows(rows).filter((slot) => slot.dayOfWeek === dayOfWeek);

  const expanded: ExpandedSlotRow[] = [];

  for (const slot of slots) {
    for (const batch of slot.batches) {
      expanded.push({
        slotId: slot.id,
        batchId: batch.id,
        batchName: batch.name,
        sportId: slot.sportId,
        sportName: slot.sportName,
        coachId: slot.coachId,
        coachName: slot.coachName,
        venue: slot.venue,
        startMinutes: slot.startMinutes,
        endMinutes: slot.endMinutes,
        scheduledAt: scheduledAtFromDateAndMinutes(dateStr, slot.startMinutes),
      });
    }
  }

  return expanded.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
}

export async function findTemplateSlotForBatchDate(
  academyId: string,
  batchId: string,
  dateStr: string
) {
  const { start } = parseDateOnly(dateStr);
  const dayOfWeek = isoWeekdayFromDate(start);

  const rows = await db
    .select({
      slotId: weeklyScheduleSlots.id,
      startMinutes: weeklyScheduleSlots.startMinutes,
      endMinutes: weeklyScheduleSlots.endMinutes,
      sportId: weeklyScheduleSlots.sportId,
      coachId: weeklyScheduleSlots.coachId,
      venue: weeklyScheduleSlots.venue,
    })
    .from(weeklyScheduleSlots)
    .innerJoin(
      weeklyScheduleSlotBatches,
      eq(weeklyScheduleSlotBatches.slotId, weeklyScheduleSlots.id)
    )
    .where(
      and(
        eq(weeklyScheduleSlots.academyId, academyId),
        eq(weeklyScheduleSlots.dayOfWeek, dayOfWeek),
        eq(weeklyScheduleSlotBatches.batchId, batchId)
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    sportId: row.sportId,
    coachId: row.coachId,
    venue: row.venue,
    scheduledAt: scheduledAtFromDateAndMinutes(dateStr, row.startMinutes),
  };
}

export async function isTimetableConfigured(academyId: string) {
  const settings = await getSettingsRow(academyId);
  return Boolean(settings?.isConfigured);
}
