import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import {
  academies,
  academySports,
  activityEvents,
  attendanceRecords,
  batchCoaches,
  batchEnrollments,
  batches,
  coachDrillPosts,
  coaches,
  drillReviews,
  drillSubmissions,
  feeInvoices,
  feePayments,
  feeTargets,
  gearMovements,
  inventoryItems,
  lineupSuggestions,
  payrollRuns,
  payslips,
  playerCoachAssignments,
  players,
  reportExports,
  sports,
  staff,
  teamFixtures,
  teamMemberResults,
  teamMembers,
  teams,
  tournamentMatches,
  tournamentMedals,
  tournaments,
  trainingSessions,
} from "@/db/schema";
import { db } from "@/lib/db/client";
import { BATCH_NAMES, SPORT_COLORS } from "./constants";
import type { AcademySeedSpec, CoachSpec, PlayerSpec } from "./distributions";

export type SeedAcademyResult = {
  academyId: string;
  slug: string;
  sportIds: Record<string, string>;
  coachIds: Record<string, string>;
  playerIds: Record<string, string>;
  batchIds: Record<string, string>;
  primarySport: string;
};

export async function upsertGlobalSports(): Promise<Record<string, string>> {
  const sportIds: Record<string, string> = {};
  for (const [name, color] of Object.entries(SPORT_COLORS)) {
    const [row] = await db
      .insert(sports)
      .values({ name, color })
      .onConflictDoUpdate({ target: sports.name, set: { color } })
      .returning();
    sportIds[name] = row.id;
  }
  return sportIds;
}

function sportCoachMap(coachSpecs: CoachSpec[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const c of coachSpecs) {
    if (!map[c.sport]) map[c.sport] = c.fullName;
  }
  return map;
}

async function ensureAcademyBatches(
  academyId: string,
  spec: AcademySeedSpec,
  sportIds: Record<string, string>
): Promise<Record<string, string>> {
  const batchIds: Record<string, string> = {};
  for (const sport of spec.sports) {
    for (const name of BATCH_NAMES) {
      const [existing] = await db
        .select()
        .from(batches)
        .where(
          and(
            eq(batches.academyId, academyId),
            eq(batches.sportId, sportIds[sport]!),
            eq(batches.name, name)
          )
        )
        .limit(1);

      if (existing) {
        batchIds[`${sport}-${name}`] = existing.id;
      } else {
        const [row] = await db
          .insert(batches)
          .values({ academyId, sportId: sportIds[sport]!, name })
          .returning();
        batchIds[`${sport}-${name}`] = row.id;
      }
    }
  }
  return batchIds;
}

async function ensureAcademyCoaches(
  academyId: string,
  spec: AcademySeedSpec,
  sportIds: Record<string, string>
): Promise<Record<string, string>> {
  const coachIds: Record<string, string> = {};
  for (const c of spec.coaches) {
    const [existing] = await db
      .select()
      .from(coaches)
      .where(and(eq(coaches.academyId, academyId), eq(coaches.fullName, c.fullName)))
      .limit(1);

    if (existing) {
      coachIds[c.fullName] = existing.id;
    } else {
      const [row] = await db
        .insert(coaches)
        .values({
          academyId,
          fullName: c.fullName,
          sportId: sportIds[c.sport]!,
          roleTitle: c.roleTitle,
          nisLevel: c.nisLevel,
          avatarColor: c.avatarColor,
          rating: c.rating,
          drillsPerWeek: c.drillsPerWeek,
        })
        .returning();
      coachIds[c.fullName] = row.id;
    }
  }
  return coachIds;
}

async function upsertAcademyPlayers(
  academyId: string,
  spec: AcademySeedSpec,
  sportIds: Record<string, string>,
  batchIds: Record<string, string>,
  coachIds: Record<string, string>,
  coachBySport: Record<string, string>
): Promise<Record<string, string>> {
  const playerIds: Record<string, string> = {};

  for (const p of spec.players) {
    const batchId = batchIds[`${p.sport}-${p.batch}`];
    const coachName = coachBySport[p.sport];
    const coachId = coachName ? coachIds[coachName] : undefined;

    const [row] = await db
      .insert(players)
      .values({
        academyId,
        externalId: p.externalId,
        fullName: p.fullName,
        sportId: sportIds[p.sport]!,
        batchId,
        primaryCoachId: coachId,
        dateOfBirth: p.dateOfBirth,
        weightCategory: p.weightCategory,
        status: p.status,
        avatarColor: p.avatarColor,
        rating: p.rating,
        monthlyFeePaise: p.monthlyFeePaise,
        joinedAt: new Date("2024-04-14"),
      })
      .onConflictDoUpdate({
        target: [players.academyId, players.externalId],
        set: {
          fullName: p.fullName,
          sportId: sportIds[p.sport]!,
          batchId,
          status: p.status,
          primaryCoachId: coachId,
          weightCategory: p.weightCategory,
          avatarColor: p.avatarColor,
          dateOfBirth: p.dateOfBirth,
          rating: p.rating,
          monthlyFeePaise: p.monthlyFeePaise,
          updatedAt: new Date(),
        },
      })
      .returning();
    playerIds[p.externalId] = row.id;

    if (batchId) {
      await db
        .insert(batchEnrollments)
        .values({ batchId, playerId: row.id })
        .onConflictDoNothing({ target: [batchEnrollments.batchId, batchEnrollments.playerId] });
    }

    if (coachId) {
      await db
        .insert(playerCoachAssignments)
        .values({ playerId: row.id, coachId, batchId, isPrimary: true })
        .onConflictDoNothing({
          target: [playerCoachAssignments.playerId, playerCoachAssignments.coachId],
        });
    }

    const [invoice] = await db
      .insert(feeInvoices)
      .values({
        playerId: row.id,
        academyId,
        period: "2026-06",
        amountPaise: p.feePaise ?? p.monthlyFeePaise,
        status: p.fee,
        dueDate: new Date("2026-06-15"),
        paidThroughPeriod: p.fee === "paid" ? "2026-06" : null,
      })
      .onConflictDoUpdate({
        target: [feeInvoices.playerId, feeInvoices.period],
        set: {
          status: p.fee,
          amountPaise: p.feePaise ?? p.monthlyFeePaise,
          paidThroughPeriod: p.fee === "paid" ? "2026-06" : null,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (p.fee === "paid" && invoice) {
      await db
        .insert(feePayments)
        .values({
          invoiceId: invoice.id,
          amountPaise: p.monthlyFeePaise,
          paidAt: new Date("2026-06-01"),
          method: "upi",
        })
        .onConflictDoNothing();
    }
  }

  const specExternalIds = spec.players.map((player) => player.externalId);
  if (specExternalIds.length > 0) {
    await db
      .update(players)
      .set({ status: "inactive", updatedAt: new Date() })
      .where(
        and(
          eq(players.academyId, academyId),
          inArray(players.status, ["active", "on_hold"]),
          notInArray(players.externalId, specExternalIds)
        )
      );
  }

  return playerIds;
}

/** Sync varied coach rosters without re-seeding full academy demo depth. */
export async function syncAcademyCoachRoster(
  spec: AcademySeedSpec,
  academyId: string,
  sportIds: Record<string, string>
): Promise<{ target: number; before: number; added: number; total: number }> {
  const [beforeRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(coaches)
    .where(eq(coaches.academyId, academyId));
  const before = beforeRow?.count ?? 0;

  const batchIds = await ensureAcademyBatches(academyId, spec, sportIds);
  const coachIds = await ensureAcademyCoaches(academyId, spec, sportIds);

  for (const c of spec.coaches) {
    const coachId = coachIds[c.fullName];
    const batchId = batchIds[`${c.sport}-${c.batchName}`];
    if (!coachId || !batchId) continue;
    await db
      .insert(batchCoaches)
      .values({ batchId, coachId, isPrimary: c.roleTitle.includes("Head") })
      .onConflictDoNothing({ target: [batchCoaches.batchId, batchCoaches.coachId] });
  }

  const [afterRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(coaches)
    .where(eq(coaches.academyId, academyId));
  const total = afterRow?.count ?? before;

  return {
    target: spec.coaches.length,
    before,
    added: total - before,
    total,
  };
}

/** Sync varied player rosters without re-seeding full academy demo depth. */
export async function syncAcademyPlayerRoster(
  spec: AcademySeedSpec,
  academyId: string,
  sportIds: Record<string, string>
): Promise<number> {
  const batchIds = await ensureAcademyBatches(academyId, spec, sportIds);
  const coachIds = await ensureAcademyCoaches(academyId, spec, sportIds);
  const coachBySport = sportCoachMap(spec.coaches);
  await upsertAcademyPlayers(academyId, spec, sportIds, batchIds, coachIds, coachBySport);
  return spec.players.length;
}

export async function seedAcademyDemoDepth(
  spec: AcademySeedSpec,
  sportIds: Record<string, string>,
  adminUserId?: string
): Promise<SeedAcademyResult> {
  const [academy] = await db
    .insert(academies)
    .values({
      slug: spec.slug,
      name: spec.name,
      district: spec.district,
      state: spec.state,
      fundingType: spec.fundingType,
      brandColor: spec.brandColor,
      initials: spec.initials,
      locationLabel: spec.locationLabel,
    })
    .onConflictDoUpdate({
      target: academies.slug,
      set: {
        name: spec.name,
        district: spec.district,
        locationLabel: spec.locationLabel,
        brandColor: spec.brandColor,
        initials: spec.initials,
        updatedAt: new Date(),
      },
    })
    .returning();

  const academyId = academy.id;
  const primarySport = spec.sports[0]!;

  for (const sportName of spec.sports) {
    await db
      .insert(academySports)
      .values({ academyId, sportId: sportIds[sportName]! })
      .onConflictDoNothing({ target: [academySports.academyId, academySports.sportId] });
  }

  const batchIds = await ensureAcademyBatches(academyId, spec, sportIds);
  const coachIds = await ensureAcademyCoaches(academyId, spec, sportIds);
  const coachBySport = sportCoachMap(spec.coaches);
  const playerIds = await upsertAcademyPlayers(
    academyId,
    spec,
    sportIds,
    batchIds,
    coachIds,
    coachBySport
  );

  for (const c of spec.coaches) {
    const coachId = coachIds[c.fullName];
    const batchId = batchIds[`${c.sport}-${c.batchName}`];
    if (!coachId || !batchId) continue;
    await db
      .insert(batchCoaches)
      .values({ batchId, coachId, isPrimary: c.roleTitle.includes("Head") })
      .onConflictDoNothing({ target: [batchCoaches.batchId, batchCoaches.coachId] });
  }

  await seedTrainingSessions(spec, academyId, sportIds, coachIds, playerIds, batchIds, coachBySport);
  await seedTeamsAndTournaments(spec, academyId, sportIds, coachIds, playerIds, batchIds, coachBySport);
  await seedInventory(spec, academyId, playerIds, spec.players);
  await seedPayrollAndStaff(spec, academyId, coachIds);
  await seedDrillsAndMedia(spec, academyId, sportIds, coachIds, playerIds, batchIds, adminUserId);
  await seedActivityAndReports(academyId);

  return { academyId, slug: spec.slug, sportIds, coachIds, playerIds, batchIds, primarySport };
}

async function seedTrainingSessions(
  spec: AcademySeedSpec,
  academyId: string,
  sportIds: Record<string, string>,
  coachIds: Record<string, string>,
  playerIds: Record<string, string>,
  batchIds: Record<string, string>,
  coachBySport: Record<string, string>
) {
  const sessionSports = spec.sports.slice(0, 4);
  const venues = ["Mat 1", "Ring 2", "Track", "Court 1", "Field A", "Hall B"];

  for (let i = 0; i < sessionSports.length; i++) {
    const sport = sessionSports[i]!;
    const batchName = BATCH_NAMES[i % BATCH_NAMES.length]!;
    const batchKey = `${sport}-${batchName}`;
    const batchId = batchIds[batchKey];
    const coachName = coachBySport[sport];
    const coachId = coachName ? coachIds[coachName] : undefined;
    if (!batchId || !coachId) continue;

    const roster = spec.players.filter((p) => p.sport === sport);
    const total = Math.max(roster.length, 4);
    const present = Math.floor(total * 0.85);
    const status = i % 2 === 0 ? ("marked" as const) : ("upcoming" as const);

    const [session] = await db
      .insert(trainingSessions)
      .values({
        academyId,
        batchId,
        coachId,
        sportId: sportIds[sport]!,
        scheduledAt: new Date(`2026-06-0${6 + (i % 2)}T0${6 + i}:00:00+05:30`),
        venue: venues[i % venues.length]!,
        expectedHeadcount: total,
        status,
      })
      .returning();

    for (let j = 0; j < total; j++) {
      const player = roster[j % roster.length];
      if (!player) continue;
      await db
        .insert(attendanceRecords)
        .values({
          sessionId: session.id,
          playerId: playerIds[player.externalId]!,
          status: j < present ? "present" : "absent",
        })
        .onConflictDoNothing();
    }
  }
}

async function seedTeamsAndTournaments(
  spec: AcademySeedSpec,
  academyId: string,
  sportIds: Record<string, string>,
  coachIds: Record<string, string>,
  playerIds: Record<string, string>,
  batchIds: Record<string, string>,
  coachBySport: Record<string, string>
) {
  const primarySport = spec.sports[0]!;
  const primaryCoach = coachBySport[primarySport];
  const teamName = `${spec.district} ${primarySport} Squad`;

  const [primaryTeam] = await db
    .insert(teams)
    .values({
      academyId,
      sportId: sportIds[primarySport]!,
      name: teamName,
      coachId: primaryCoach ? coachIds[primaryCoach] : null,
      weightClass: spec.players[0]?.weightCategory ?? "Open",
      color: spec.brandColor,
    })
    .onConflictDoNothing()
    .returning();

  let teamId = primaryTeam?.id;
  if (!teamId) {
    const [existing] = await db
      .select()
      .from(teams)
      .where(and(eq(teams.academyId, academyId), eq(teams.name, teamName)))
      .limit(1);
    teamId = existing?.id;
  }

  if (teamId) {
    const primaryRoster = spec.players.filter((p) => p.sport === primarySport).slice(0, 4);
    for (let i = 0; i < primaryRoster.length; i++) {
      const member = primaryRoster[i]!;
      const [tm] = await db
        .insert(teamMembers)
        .values({
          teamId,
          playerId: playerIds[member.externalId]!,
          role: i === 0 ? "captain" : "member",
          selectionStatus: i % 3 === 2 ? "standby" : "selected",
        })
        .onConflictDoNothing()
        .returning();

      if (tm) {
        const form = ["W", "L", "W", "W"] as const;
        for (let f = 0; f < form.length; f++) {
          await db
            .insert(teamMemberResults)
            .values({ teamMemberId: tm.id, result: form[f]!, sequence: f })
            .onConflictDoNothing();
        }
      }
    }

    await db
      .insert(teamFixtures)
      .values({
        teamId,
        opponentName: "Inter-Academy Meet",
        venue: spec.district,
        scheduledAt: new Date("2026-03-12T10:00:00+05:30"),
        status: "scheduled",
      })
      .onConflictDoNothing();

    await db
      .insert(lineupSuggestions)
      .values({
        teamId,
        title: "Inter-Academy Meet",
        suggestedPlayerIds: primaryRoster.map((p) => playerIds[p.externalId]!),
        rationale: "Based on recent form and ratings",
      })
      .onConflictDoNothing();
  }

  for (let i = 1; i < Math.min(spec.sports.length, 4); i++) {
    const sport = spec.sports[i]!;
    const coach = coachBySport[sport];
    await db
      .insert(teams)
      .values({
        academyId,
        sportId: sportIds[sport]!,
        name: `${spec.district} ${sport} Team`,
        coachId: coach ? coachIds[coach] : null,
        color: SPORT_COLORS[sport] ?? spec.brandColor,
      })
      .onConflictDoNothing();
  }

  const tournamentName = `Haryana Inter-Academy ${primarySport} · ${spec.slug}`;
  const [tournament] = await db
    .insert(tournaments)
    .values({
      academyId,
      name: tournamentName,
      location: spec.district,
      startDate: new Date("2026-03-12"),
      endDate: new Date("2026-03-14"),
      status: "live",
      sportId: sportIds[primarySport]!,
      weightClass: spec.players[0]?.weightCategory ?? "Open",
      participantAcademies: 16,
      participantAthletes: 240,
    })
    .onConflictDoNothing()
    .returning();

  let tournamentId = tournament?.id;
  if (!tournamentId) {
    const [existing] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.name, tournamentName))
      .limit(1);
    tournamentId = existing?.id;
  }

  if (tournamentId) {
    const firstPlayer = spec.players.find((p) => p.sport === primarySport);
    await db
      .insert(tournamentMatches)
      .values({
        tournamentId,
        round: "QF",
        bracketPosition: 1,
        playerAId: firstPlayer ? playerIds[firstPlayer.externalId] : null,
        playerAName: firstPlayer?.fullName.split(" ")[0] ?? "TBD",
        playerBName: "Opponent",
        scoreA: 10,
        scoreB: 4,
        status: "completed",
      })
      .onConflictDoNothing();

    await db
      .insert(tournamentMedals)
      .values({ tournamentId, academyId, gold: 2, silver: 1, bronze: 3 })
      .onConflictDoUpdate({
        target: tournamentMedals.tournamentId,
        set: { gold: 2, silver: 1, bronze: 3, updatedAt: new Date() },
      });
  }
}

async function seedInventory(
  spec: AcademySeedSpec,
  academyId: string,
  playerIds: Record<string, string>,
  playerSpecs: PlayerSpec[]
) {
  const categories = spec.sports.slice(0, 4);
  const items = [
    ...categories.map((sport, i) => ({
      name: `${sport} kit`,
      category: sport,
      inStock: 20 + i * 5,
      issued: 30 + i * 8,
      condition: "good" as const,
      threshold: 10,
      iconBg: "var(--brand-soft)",
      iconColor: SPORT_COLORS[sport] ?? "#2756D8",
    })),
    {
      name: "Training cones (set)",
      category: "Common",
      inStock: 22,
      issued: 6,
      condition: "good" as const,
      threshold: 5,
      iconBg: "#EAF0FF",
      iconColor: "#2756D8",
    },
    {
      name: "Skipping ropes",
      category: "Common",
      inStock: 40,
      issued: 52,
      condition: "good" as const,
      threshold: 10,
      iconBg: "#FDECEC",
      iconColor: "#D63B3B",
    },
  ];

  for (const item of items) {
    const [row] = await db
      .insert(inventoryItems)
      .values({
        academyId,
        name: item.name,
        category: item.category,
        inStock: item.inStock,
        issuedCount: item.issued,
        condition: item.condition,
        lowStockThreshold: item.threshold,
        iconBg: item.iconBg,
        iconColor: item.iconColor,
      })
      .onConflictDoNothing()
      .returning();

    const firstPlayer = playerSpecs[0];
    if (row && firstPlayer) {
      await db
        .insert(gearMovements)
        .values({
          itemId: row.id,
          playerId: playerIds[firstPlayer.externalId],
          quantity: 1,
          type: "issue",
          notes: `Issued to ${firstPlayer.fullName}`,
          expectedReturnAt: new Date(Date.now() - 2 * 24 * 3600000),
          createdAt: new Date(Date.now() - 25 * 60000),
        })
        .onConflictDoNothing();
    }
  }
}

async function seedPayrollAndStaff(
  spec: AcademySeedSpec,
  academyId: string,
  coachIds: Record<string, string>
) {
  const [payrollRun] = await db
    .insert(payrollRuns)
    .values({
      academyId,
      periodStart: new Date("2026-06-01"),
      periodEnd: new Date("2026-06-30"),
    })
    .onConflictDoNothing()
    .returning();

  let payrollRunId = payrollRun?.id;
  if (!payrollRunId) {
    const [existing] = await db
      .select()
      .from(payrollRuns)
      .where(eq(payrollRuns.academyId, academyId))
      .limit(1);
    payrollRunId = existing?.id;
  }

  for (const s of spec.staff) {
    const [existingStaff] = await db
      .select()
      .from(staff)
      .where(and(eq(staff.academyId, academyId), eq(staff.fullName, s.fullName)))
      .limit(1);

    const staffRow =
      existingStaff ??
      (
        await db
          .insert(staff)
          .values({
            academyId,
            fullName: s.fullName,
            roleTitle: s.roleTitle,
            employmentType: s.employmentType,
            monthlySalaryPaise: s.monthlySalaryPaise,
            avatarColor: s.avatarColor,
          })
          .returning()
      )[0];

    if (s.linkedCoachName && coachIds[s.linkedCoachName]) {
      await db
        .update(coaches)
        .set({ staffId: staffRow.id, updatedAt: new Date() })
        .where(eq(coaches.id, coachIds[s.linkedCoachName]!));
    }

    if (payrollRunId) {
      await db
        .insert(payslips)
        .values({
          payrollRunId,
          staffId: staffRow.id,
          daysPresent: s.paid ? 26 : 14,
          daysExpected: s.employmentType === "part_time" ? 16 : 26,
          amountPaise: s.monthlySalaryPaise,
          status: s.paid ? "paid" : "pending",
        })
        .onConflictDoNothing();
    }
  }
}

async function seedDrillsAndMedia(
  spec: AcademySeedSpec,
  academyId: string,
  sportIds: Record<string, string>,
  coachIds: Record<string, string>,
  playerIds: Record<string, string>,
  batchIds: Record<string, string>,
  adminUserId?: string
) {
  const sampleVideoUrl = "/uploads/coach-media/sample-reference.mp4";
  const drillPlayers = spec.players.slice(0, 4);
  const gradients = [
    "linear-gradient(135deg, #0E1B33, #1E335C)",
    "linear-gradient(135deg, #7C5CFC, #A78BFA)",
    "linear-gradient(135deg, #2F6BFF, #5B8DEF)",
    "linear-gradient(135deg, #7a2d12, #FF6B2C)",
  ];

  for (let i = 0; i < drillPlayers.length; i++) {
    const player = drillPlayers[i]!;
    const coachName = spec.coaches.find((c) => c.sport === player.sport)?.fullName;
    const coachId = coachName ? coachIds[coachName] : undefined;
    if (!coachId) continue;

    const published = i >= 2;
    await db
      .insert(drillSubmissions)
      .values({
        academyId,
        playerId: playerIds[player.externalId]!,
        coachId,
        drillName: `${player.sport} drill ${i + 1}`,
        videoUrl: sampleVideoUrl,
        thumbnailGradient: gradients[i % gradients.length]!,
        durationSeconds: 28,
        submittedAt: new Date(Date.now() - (i + 2) * 3600000),
        status: published ? "reviewed" : "pending",
        publishedAt: published ? new Date(Date.now() - (i + 1) * 3600000) : null,
        publishedByCoachId: published ? coachId : null,
      })
      .onConflictDoNothing();
  }

  const reviewedRows = await db
    .select({ id: drillSubmissions.id, coachId: drillSubmissions.coachId })
    .from(drillSubmissions)
    .where(and(eq(drillSubmissions.academyId, academyId), eq(drillSubmissions.status, "reviewed")));

  for (const row of reviewedRows) {
    await db
      .insert(drillReviews)
      .values({
        submissionId: row.id,
        reviewerCoachId: row.coachId,
        rating: 8,
        notes: "Good effort — keep driving through the finish.",
        criteriaScores: { technique: 8, speed: 7, form: 8 },
        reviewedAt: new Date(Date.now() - 24 * 3600000),
      })
      .onConflictDoNothing();
  }

  const primaryCoach = spec.coaches[0];
  const primarySport = spec.sports[0]!;
  if (primaryCoach) {
    const batchId = batchIds[`${primarySport}-Sub-junior`];
    await db
      .insert(coachDrillPosts)
      .values({
        academyId,
        coachId: coachIds[primaryCoach.fullName]!,
        sportId: sportIds[primarySport]!,
        batchId,
        drillName: `${primarySport} fundamentals · 3 × 10`,
        description: "Focus on clean technique and consistent reps.",
        videoUrl: sampleVideoUrl,
        thumbnailGradient: gradients[0]!,
        durationSeconds: 35,
        postedAt: new Date(Date.now() - 12 * 3600000),
        publishedAt: new Date(Date.now() - 10 * 3600000),
        publishedByCoachId: coachIds[primaryCoach.fullName]!,
      })
      .onConflictDoNothing();
  }

  void adminUserId;
}

async function seedActivityAndReports(academyId: string) {
  const activityDefs = [
    { actor: "Fee collection", desc: "June fees processed", type: "check", minsAgo: 12 },
    { actor: "Drill reviews", desc: "Coach reviewed submissions", type: "video", minsAgo: 60 },
    { actor: "New enrollments", desc: "Players enrolled this week", type: "users", minsAgo: 180 },
  ];

  for (const a of activityDefs) {
    await db
      .insert(activityEvents)
      .values({
        academyId,
        eventType: a.type,
        actorName: a.actor,
        description: a.desc,
        metadata: { type: a.type },
        createdAt: new Date(Date.now() - a.minsAgo * 60000),
      })
      .onConflictDoNothing();
  }

  await db
    .insert(feeTargets)
    .values({ academyId, period: "2026-06", targetPaise: 12000000 })
    .onConflictDoUpdate({
      target: [feeTargets.academyId, feeTargets.period],
      set: { targetPaise: 12000000, updatedAt: new Date() },
    });

  const reportTypes = [
    "Player attendance summary",
    "Fee collection report",
    "Coach drill review log",
    "Inventory audit",
    "Payroll disbursement",
    "Tournament results",
  ];

  for (const reportType of reportTypes) {
    await db
      .insert(reportExports)
      .values({
        academyId,
        reportType,
        periodLabel: "June 2026",
        status: "ready",
        generatedAt: new Date(),
      })
      .onConflictDoNothing();
  }
}
