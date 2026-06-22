import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  academies,
  coaches,
  players,
  stateFundDisbursements,
  stateFundSchemes,
  stateNurseryRegistrations,
} from "@/db/schema";
import type { StateFundDisbursementStatus } from "@/lib/state-fund-schemes";
import { getSchemeBySlug } from "./state-funds";
import { getListedNurseryAcademyIdSet } from "./state-nursery-helpers";

export type CreateDisbursementInput = {
  schemeSlug: string;
  beneficiaryId: string;
  amountPaise: number;
  status: StateFundDisbursementStatus;
  dueDate?: Date | null;
  referenceNote?: string;
  createdByUserId: string;
};

async function assertBeneficiaryInRegisteredNursery(
  beneficiaryType: "athlete" | "coach" | "nursery",
  beneficiaryId: string
) {
  const nurseryIds = await getListedNurseryAcademyIdSet();

  if (beneficiaryType === "nursery") {
    if (!nurseryIds.has(beneficiaryId)) {
      throw new Error("Nursery is not registered with the state.");
    }
    return { playerId: null as string | null, coachId: null as string | null, academyId: beneficiaryId };
  }

  if (beneficiaryType === "athlete") {
    const [player] = await db
      .select({ id: players.id, academyId: players.academyId })
      .from(players)
      .innerJoin(academies, eq(players.academyId, academies.id))
      .where(
        and(
          eq(players.id, beneficiaryId),
          inArray(players.status, ["active", "on_hold"]),
          isNull(academies.deletedAt)
        )
      )
      .limit(1);

    if (!player || !nurseryIds.has(player.academyId)) {
      throw new Error("Athlete not found in a registered nursery.");
    }
    return { playerId: player.id, coachId: null, academyId: null };
  }

  const [coach] = await db
    .select({ id: coaches.id, academyId: coaches.academyId })
    .from(coaches)
    .innerJoin(academies, eq(coaches.academyId, academies.id))
    .where(and(eq(coaches.id, beneficiaryId), isNull(academies.deletedAt)))
    .limit(1);

  if (!coach || !nurseryIds.has(coach.academyId)) {
    throw new Error("Coach not found in a registered nursery.");
  }
  return { playerId: null, coachId: coach.id, academyId: null };
}

export async function createDisbursement(input: CreateDisbursementInput) {
  if (input.amountPaise <= 0) {
    throw new Error("Grant amount must be greater than zero.");
  }

  const scheme = await getSchemeBySlug(input.schemeSlug);
  if (!scheme) throw new Error("Scheme not found.");

  const beneficiary = await assertBeneficiaryInRegisteredNursery(
    scheme.beneficiaryType,
    input.beneficiaryId
  );

  const now = new Date();
  const isPaid = input.status === "paid";

  const [row] = await db
    .insert(stateFundDisbursements)
    .values({
      schemeId: scheme.id,
      amountPaise: input.amountPaise,
      status: input.status,
      playerId: beneficiary.playerId,
      coachId: beneficiary.coachId,
      academyId: beneficiary.academyId,
      dueDate: input.dueDate ?? null,
      paidAt: isPaid ? now : null,
      referenceNote: input.referenceNote ?? null,
      createdByUserId: input.createdByUserId,
      paidByUserId: isPaid ? input.createdByUserId : null,
    })
    .returning();

  return row!;
}

export async function releasePendingDisbursements(options: {
  schemeSlug?: string;
  disbursementId?: string;
  paidByUserId: string;
}) {
  const conditions = [eq(stateFundDisbursements.status, "pending")];

  if (options.disbursementId) {
    conditions.push(eq(stateFundDisbursements.id, options.disbursementId));
  } else if (options.schemeSlug) {
    const scheme = await getSchemeBySlug(options.schemeSlug);
    if (!scheme) throw new Error("Scheme not found.");
    conditions.push(eq(stateFundDisbursements.schemeId, scheme.id));
  }

  const now = new Date();
  const pending = await db
    .select({ id: stateFundDisbursements.id })
    .from(stateFundDisbursements)
    .where(and(...conditions));

  if (pending.length === 0) return { released: 0 };

  await db
    .update(stateFundDisbursements)
    .set({
      status: "paid",
      paidAt: now,
      paidByUserId: options.paidByUserId,
      updatedAt: now,
    })
    .where(
      inArray(
        stateFundDisbursements.id,
        pending.map((p) => p.id)
      )
    );

  return { released: pending.length };
}

/** Ensures beneficiary belongs to a registered nursery (for API validation). */
export async function validateNurseryRegistration(academyId: string) {
  const [row] = await db
    .select({ academyId: stateNurseryRegistrations.academyId })
    .from(stateNurseryRegistrations)
    .where(eq(stateNurseryRegistrations.academyId, academyId))
    .limit(1);
  return Boolean(row);
}

export async function countDistinctPaidBeneficiariesForFiscalYear(fiscalYearId: string) {
  const [row] = await db
    .select({
      count: sql<number>`count(distinct coalesce(${stateFundDisbursements.playerId}::text, ${stateFundDisbursements.coachId}::text, ${stateFundDisbursements.academyId}::text))`,
    })
    .from(stateFundDisbursements)
    .innerJoin(stateFundSchemes, eq(stateFundDisbursements.schemeId, stateFundSchemes.id))
    .where(
      and(eq(stateFundSchemes.fiscalYearId, fiscalYearId), eq(stateFundDisbursements.status, "paid"))
    );

  return Number(row?.count ?? 0);
}
