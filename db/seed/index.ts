import { loadEnv } from "@/lib/load-env";
import { seedIdentityUsers } from "@/db/seed/identity";
import { and, eq } from "drizzle-orm";
import {
  academies,
  academyMemberships,
  academySports,
  activityEvents,
  attendanceRecords,
  batchCoaches,
  batchEnrollments,
  batches,
  coaches,
  coachDrillPosts,
  drillReviews,
  drillSubmissions,
  mediaPostComments,
  mediaPostLikes,
  playerFollows,
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
  users,
} from "../schema";
import { db } from "@/lib/db/client";
import { SEED_ACADEMY_ID, SEED_ACADEMY_SLUG } from "@/lib/seed-constants";

loadEnv();

const SPORT_COLORS: Record<string, string> = {
  Wrestling: "#FF6B2C",
  Boxing: "#12B886",
  Athletics: "#2F6BFF",
  Kabaddi: "#F5A623",
  Hockey: "#7C5CFC",
};

async function upsertSports() {
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

async function main() {
  console.log("Seeding Khel Setu academy data...");

  const { academyAdmin: academyAdminSeed } = await seedIdentityUsers();

  const sportIds = await upsertSports();

  const [academy] = await db
    .insert(academies)
    .values({
      id: SEED_ACADEMY_ID,
      slug: SEED_ACADEMY_SLUG,
      name: "Dronacharya Sports Academy",
      district: "Sonipat",
      state: "Haryana",
      fundingType: "govt_aided",
      brandColor: "#FF6B2C",
      initials: "DA",
      locationLabel: "Sonipat · Govt-aided",
    })
    .onConflictDoUpdate({
      target: academies.slug,
      set: {
        name: "Dronacharya Sports Academy",
        locationLabel: "Sonipat · Govt-aided",
        updatedAt: new Date(),
      },
    })
    .returning();

  const academyId = academy.id;

  for (const sportName of ["Wrestling", "Boxing", "Athletics", "Kabaddi"]) {
    await db
      .insert(academySports)
      .values({ academyId, sportId: sportIds[sportName] })
      .onConflictDoNothing({ target: [academySports.academyId, academySports.sportId] });
  }

  if (!academyAdminSeed) {
    throw new Error(
      "Academy demo data requires SEED_ACADEMY_ADMIN_EMAIL and SEED_ACADEMY_ADMIN_PASSWORD in .env."
    );
  }

  const [admin] = await db
    .select()
    .from(users)
    .where(eq(users.email, academyAdminSeed.email))
    .limit(1);

  if (!admin) {
    throw new Error(`Academy admin user not found for ${academyAdminSeed.email}.`);
  }

  const adminId = admin.id;

  await db
    .insert(academyMemberships)
    .values({ userId: adminId, academyId, role: "admin" })
    .onConflictDoNothing();

  const academySportNames = ["Wrestling", "Boxing", "Athletics", "Kabaddi"] as const;
  const batchNames = ["Sub-junior", "Junior", "Senior"] as const;

  const batchIds: Record<string, string> = {};
  for (const sport of academySportNames) {
    for (const name of batchNames) {
      const [existing] = await db
        .select()
        .from(batches)
        .where(
          and(
            eq(batches.academyId, academyId),
            eq(batches.sportId, sportIds[sport]),
            eq(batches.name, name)
          )
        )
        .limit(1);

      if (existing) {
        batchIds[`${sport}-${name}`] = existing.id;
      } else {
        const [row] = await db
          .insert(batches)
          .values({
            academyId,
            sportId: sportIds[sport],
            name,
          })
          .returning();
        batchIds[`${sport}-${name}`] = row.id;
      }
    }
  }

  const coachDefs = [
    { name: "Naveen Kadyan", sport: "Wrestling", role: "Wrestling · Head Coach", nis: "nis_level_2" as const, color: "#FF6B2C", rating: "4.8", drills: 4 },
    { name: "Sunita Rani", sport: "Boxing", role: "Boxing · Senior Coach", nis: "nis_level_1" as const, color: "#7C5CFC", rating: "4.7", drills: 3 },
    { name: "Vikram Malik", sport: "Athletics", role: "Athletics · Coach", nis: "nis_level_1" as const, color: "#2F6BFF", rating: "4.6", drills: 5 },
    { name: "Jagdeep Singh", sport: "Kabaddi", role: "Kabaddi · Coach", nis: "in_review" as const, color: "#12B886", rating: "4.5", drills: 2 },
  ];

  const coachIds: Record<string, string> = {};
  for (const c of coachDefs) {
    const [existing] = await db
      .select()
      .from(coaches)
      .where(and(eq(coaches.academyId, academyId), eq(coaches.fullName, c.name)))
      .limit(1);

    if (existing) {
      coachIds[c.name] = existing.id;
    } else {
      const [row] = await db
        .insert(coaches)
        .values({
          academyId,
          fullName: c.name,
          sportId: sportIds[c.sport],
          roleTitle: c.role,
          nisLevel: c.nis,
          avatarColor: c.color,
          rating: c.rating,
          drillsPerWeek: c.drills,
        })
        .returning();
      coachIds[c.name] = row.id;
    }
  }

  const sportCoachMap: Record<string, string> = {
    Wrestling: "Naveen Kadyan",
    Boxing: "Sunita Rani",
    Athletics: "Vikram Malik",
    Kabaddi: "Jagdeep Singh",
  };

  const playerDefs: Array<{
    externalId: string;
    name: string;
    sport: string;
    batch: string;
    weight: string;
    color: string;
    status: "active" | "on_hold";
    dob: Date;
    fee: "paid" | "due" | "partial";
    feePaise?: number;
    rating: string;
    monthlyFeePaise: number;
  }> = [
    { externalId: "HRWR-1042", name: "Rohit Sangwan", sport: "Wrestling", batch: "Sub-junior", weight: "65kg", color: "#FF6B2C", status: "active", dob: new Date("2010-03-15"), fee: "paid", rating: "7.8", monthlyFeePaise: 150000 },
    { externalId: "HRBX-0218", name: "Priya Dahiya", sport: "Boxing", batch: "Junior", weight: "54kg", color: "#7C5CFC", status: "active", dob: new Date("2011-07-22"), fee: "paid", rating: "7.4", monthlyFeePaise: 150000 },
    { externalId: "HRWR-1067", name: "Aman Phogat", sport: "Wrestling", batch: "Sub-junior", weight: "48kg", color: "#2F6BFF", status: "active", dob: new Date("2012-01-10"), fee: "due", feePaise: 150000, rating: "7.1", monthlyFeePaise: 150000 },
    { externalId: "HRAT-0091", name: "Sahil Malik", sport: "Athletics", batch: "Senior", weight: "400m", color: "#12B886", status: "active", dob: new Date("2009-05-18"), fee: "paid", rating: "7.6", monthlyFeePaise: 180000 },
    { externalId: "HRKB-0153", name: "Neha Kadyan", sport: "Kabaddi", batch: "Junior", weight: "Raider", color: "#F5A623", status: "on_hold", dob: new Date("2010-11-30"), fee: "paid", rating: "6.9", monthlyFeePaise: 120000 },
    { externalId: "HRWR-1088", name: "Vikas Sheoran", sport: "Wrestling", batch: "Sub-junior", weight: "57kg", color: "#E11D48", status: "active", dob: new Date("2011-04-05"), fee: "paid", rating: "7.3", monthlyFeePaise: 150000 },
    { externalId: "HRBX-0240", name: "Manju Rani", sport: "Boxing", batch: "Junior", weight: "60kg", color: "#0E9B72", status: "active", dob: new Date("2010-09-12"), fee: "partial", feePaise: 120000, rating: "7.0", monthlyFeePaise: 150000 },
    { externalId: "HRWR-1099", name: "Deepak Kundu", sport: "Wrestling", batch: "Sub-junior", weight: "52 kg", color: "#12B886", status: "active", dob: new Date("2011-02-20"), fee: "paid", rating: "7.2", monthlyFeePaise: 150000 },
  ];

  const playerIds: Record<string, string> = {};
  for (const p of playerDefs) {
    const batchId = batchIds[`${p.sport}-${p.batch}`];
    const coachId = coachIds[sportCoachMap[p.sport]];
    const [row] = await db
      .insert(players)
      .values({
        academyId,
        externalId: p.externalId,
        fullName: p.name,
        sportId: sportIds[p.sport],
        batchId,
        primaryCoachId: coachId,
        dateOfBirth: p.dob,
        weightCategory: p.weight,
        status: p.status,
        avatarColor: p.color,
        rating: p.rating,
        monthlyFeePaise: p.monthlyFeePaise,
        joinedAt: new Date("2024-04-14"),
      })
      .onConflictDoUpdate({
        target: [players.academyId, players.externalId],
        set: {
          fullName: p.name,
          status: p.status,
          primaryCoachId: coachId,
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
        .values({
          playerId: row.id,
          coachId,
          batchId,
          isPrimary: true,
        })
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
      await db.insert(feePayments).values({
        invoiceId: invoice.id,
        amountPaise: 150000,
        paidAt: new Date("2026-06-01"),
        method: "upi",
      }).onConflictDoNothing();
    }
  }

  const sessionDefs = [
    { batch: "Wrestling-Sub-junior", coach: "Naveen Kadyan", sport: "Wrestling", at: new Date("2026-06-06T06:00:00+05:30"), venue: "Mat 1", status: "marked" as const, present: 42, total: 45 },
    { batch: "Boxing-Junior", coach: "Sunita Rani", sport: "Boxing", at: new Date("2026-06-06T07:30:00+05:30"), venue: "Ring 2", status: "marked" as const, present: 28, total: 30 },
    { batch: "Athletics-Senior", coach: "Vikram Malik", sport: "Athletics", at: new Date("2026-06-06T16:30:00+05:30"), venue: "Track", status: "upcoming" as const, present: 0, total: 38 },
    { batch: "Kabaddi-Junior", coach: "Jagdeep Singh", sport: "Kabaddi", at: new Date("2026-06-06T17:00:00+05:30"), venue: "Court 1", status: "upcoming" as const, present: 0, total: 36 },
  ];

  for (const sport of academySportNames) {
    const coachId = coachIds[sportCoachMap[sport]];
    if (!coachId) continue;

    for (const name of batchNames) {
      const batchId = batchIds[`${sport}-${name}`];
      if (!batchId) continue;

      await db
        .insert(batchCoaches)
        .values({ batchId, coachId, isPrimary: true })
        .onConflictDoNothing({ target: [batchCoaches.batchId, batchCoaches.coachId] });
    }
  }

  for (const s of sessionDefs) {
    const [batchKey, batchName] = s.batch.split("-");
    const batchId = batchIds[`${batchKey}-${batchName}`];
    const [session] = await db
      .insert(trainingSessions)
      .values({
        academyId,
        batchId,
        coachId: coachIds[s.coach],
        sportId: sportIds[s.sport],
        scheduledAt: s.at,
        venue: s.venue,
        expectedHeadcount: s.total,
        status: s.status,
      })
      .returning();

    const roster = playerDefs.filter((p) => p.sport === s.sport);
    for (let i = 0; i < Math.min(s.total, roster.length + 3); i++) {
      const player = roster[i % roster.length];
      if (!player) continue;
      const isPresent = i < s.present;
      await db
        .insert(attendanceRecords)
        .values({
          sessionId: session.id,
          playerId: playerIds[player.externalId],
          status: isPresent ? "present" : "absent",
        })
        .onConflictDoNothing();
    }
  }

  const [wrestlingTeam] = await db
    .insert(teams)
    .values({
      academyId,
      sportId: sportIds.Wrestling,
      name: "Sonipat Sub-Junior Wrestling Squad",
      coachId: coachIds["Naveen Kadyan"],
      weightClass: "65 kg",
      color: "#FF6B2C",
    })
    .onConflictDoNothing()
    .returning();

  let teamId = wrestlingTeam?.id;
  if (!teamId) {
    const [existing] = await db
      .select()
      .from(teams)
      .where(and(eq(teams.academyId, academyId), eq(teams.name, "Sonipat Sub-Junior Wrestling Squad")))
      .limit(1);
    teamId = existing!.id;
  }

  const teamRoster = [
    { externalId: "HRWR-1042", role: "captain" as const, selection: "selected" as const, form: ["W", "W", "L", "W"] },
    { externalId: "HRWR-1067", role: "member" as const, selection: "selected" as const, form: ["W", "W", "W", "W"] },
    { externalId: "HRWR-1088", role: "member" as const, selection: "standby" as const, form: ["W", "L", "W", "W"] },
    { externalId: "HRWR-1099", role: "member" as const, selection: "selected" as const, form: ["L", "W", "W", "L"] },
  ];

  for (const member of teamRoster) {
    const [tm] = await db
      .insert(teamMembers)
      .values({
        teamId,
        playerId: playerIds[member.externalId],
        role: member.role,
        selectionStatus: member.selection,
      })
      .onConflictDoNothing()
      .returning();

    if (tm) {
      for (let i = 0; i < member.form.length; i++) {
        await db.insert(teamMemberResults).values({
          teamMemberId: tm.id,
          result: member.form[i] as "W" | "L",
          sequence: i,
        }).onConflictDoNothing();
      }
    }
  }

  const otherTeamDefs = [
    { name: "Junior Boxing Team", sport: "Boxing", coach: "Sunita Rani", color: "#7C5CFC" },
    { name: "Kabaddi Senior Squad", sport: "Kabaddi", coach: "Jagdeep Singh", color: "#F5A623" },
    { name: "Relay 4×100m", sport: "Athletics", coach: "Vikram Malik", color: "#2F6BFF" },
  ];

  for (const t of otherTeamDefs) {
    await db
      .insert(teams)
      .values({
        academyId,
        sportId: sportIds[t.sport],
        name: t.name,
        coachId: coachIds[t.coach],
        color: t.color,
      })
      .onConflictDoNothing();
  }

  await db
    .insert(teamFixtures)
    .values({
      teamId,
      tournamentId: undefined,
      opponentName: "Inter-Academy Meet",
      venue: "Sonipat",
      scheduledAt: new Date("2026-03-12T10:00:00+05:30"),
      status: "scheduled",
    })
    .onConflictDoNothing();

  await db
    .insert(lineupSuggestions)
    .values({
      teamId,
      title: "Inter-Academy Meet",
      suggestedPlayerIds: teamRoster.map((member) => playerIds[member.externalId]),
      rationale: "Based on recent form & ratings, KhelSetu suggests",
    })
    .onConflictDoNothing();

  const [tournament] = await db
    .insert(tournaments)
    .values({
      academyId,
      name: "Haryana Inter-Academy Wrestling Championship 2026",
      location: "Sonipat",
      startDate: new Date("2026-03-12"),
      endDate: new Date("2026-03-14"),
      status: "live",
      sportId: sportIds.Wrestling,
      weightClass: "65 kg",
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
      .where(eq(tournaments.name, "Haryana Inter-Academy Wrestling Championship 2026"))
      .limit(1);
    tournamentId = existing!.id;
  }

  const qfMatches = [
    { round: "QF", pos: 1, a: "R. Sangwan", b: "K. Sheoran", sa: 10, sb: 4, winner: "a" },
    { round: "QF", pos: 2, a: "S. Hooda", b: "A. Dahiya", sa: 6, sb: 2, winner: "a" },
    { round: "QF", pos: 3, a: "D. Malik", b: "P. Rana", sa: 8, sb: 5, winner: "a" },
    { round: "QF", pos: 4, a: "M. Yadav", b: "V. Kadyan", sa: 3, sb: 7, winner: "b" },
    { round: "SF", pos: 1, a: "R. Sangwan", b: "S. Hooda", status: "live" as const, mat: "Mat 1 · Live", at: new Date("2026-03-12T14:30:00+05:30") },
    { round: "SF", pos: 2, a: "D. Malik", b: "V. Kadyan", mat: "Mat 2 · Next", at: new Date("2026-03-12T15:00:00+05:30") },
    { round: "Final", pos: 1, a: "TBD", b: "TBD", mat: "Mat 1 · Final", at: new Date("2026-03-12T16:00:00+05:30") },
  ];

  for (const m of qfMatches) {
    await db.insert(tournamentMatches).values({
      tournamentId,
      round: m.round,
      bracketPosition: m.pos,
      playerAId: m.a === "R. Sangwan" ? playerIds["HRWR-1042"] : null,
      playerBId: null,
      playerAName: m.a,
      playerBName: m.b,
      scoreA: "sa" in m ? m.sa : null,
      scoreB: "sb" in m ? m.sb : null,
      status: "status" in m ? m.status : "completed",
      matLabel: "mat" in m ? m.mat : null,
      scheduledAt: "at" in m ? m.at : null,
    }).onConflictDoNothing();
  }

  await db
    .insert(tournamentMedals)
    .values({
      tournamentId,
      academyId,
      gold: 3,
      silver: 2,
      bronze: 4,
    })
    .onConflictDoUpdate({
      target: tournamentMedals.tournamentId,
      set: { gold: 3, silver: 2, bronze: 4, updatedAt: new Date() },
    });

  const inventoryDefs = [
    { name: "Wrestling singlets", category: "Wrestling", inStock: 64, issued: 96, condition: "good" as const, threshold: 10, iconBg: "var(--brand-soft)", iconColor: "var(--brand-d)" },
    { name: "Boxing gloves · 12oz", category: "Boxing", inStock: 8, issued: 46, condition: "worn" as const, threshold: 15, iconBg: "var(--purple-soft)", iconColor: "#6443E0" },
    { name: "Track spikes", category: "Athletics", inStock: 31, issued: 40, condition: "good" as const, threshold: 10, iconBg: "var(--blue-soft)", iconColor: "#2756D8" },
    { name: "Kabaddi mats (section)", category: "Kabaddi", inStock: 12, issued: 0, condition: "good" as const, threshold: 5, iconBg: "var(--amber-soft)", iconColor: "#C77F12" },
    { name: "Head guards", category: "Boxing", inStock: 3, issued: 28, condition: "worn" as const, threshold: 10, iconBg: "var(--green-soft)", iconColor: "#0E9B72" },
    { name: "Training cones (set)", category: "Common", inStock: 22, issued: 6, condition: "good" as const, threshold: 5, iconBg: "#EAF0FF", iconColor: "#2756D8" },
    { name: "Skipping ropes", category: "Common", inStock: 40, issued: 52, condition: "good" as const, threshold: 10, iconBg: "#FDECEC", iconColor: "#D63B3B" },
  ];

  for (const item of inventoryDefs) {
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

    if (row && item.name === "Wrestling singlets") {
      await db.insert(gearMovements).values({
        itemId: row.id,
        playerId: playerIds["HRWR-1042"],
        quantity: 2,
        type: "issue",
        notes: "2× singlets issued to R. Sangwan",
        expectedReturnAt: new Date(Date.now() - 2 * 24 * 3600000),
        createdAt: new Date(Date.now() - 25 * 60000),
      }).onConflictDoNothing();
    }
  }

  const staffDefs = [
    { name: "Naveen Kadyan", role: "Head Coach · Wrestling", type: "full_time" as const, salary: 5500000, color: "#FF6B2C", paid: true },
    { name: "Sunita Rani", role: "Senior Coach · Boxing", type: "full_time" as const, salary: 4200000, color: "#7C5CFC", paid: true },
    { name: "Vikram Malik", role: "Coach · Athletics", type: "full_time" as const, salary: 3800000, color: "#2F6BFF", paid: true },
    { name: "Dr. Ritu Phogat", role: "Physiotherapist", type: "part_time" as const, salary: 2800000, color: "#12B886", paid: false },
    { name: "Om Prakash", role: "Groundskeeper", type: "full_time" as const, salary: 1800000, color: "#F5A623", paid: true },
    { name: "Sarita Antil", role: "Accountant", type: "full_time" as const, salary: 3200000, color: "#E11D48", paid: true },
    { name: "Ramesh Saini", role: "Security", type: "full_time" as const, salary: 1600000, color: "#0E9B72", paid: false },
  ];

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
    payrollRunId = existing!.id;
  }

  const staffIds: Record<string, string> = {};
  for (const s of staffDefs) {
    const [existingStaff] = await db
      .select()
      .from(staff)
      .where(and(eq(staff.academyId, academyId), eq(staff.fullName, s.name)))
      .limit(1);

    const staffRow =
      existingStaff ??
      (
        await db
          .insert(staff)
          .values({
            academyId,
            fullName: s.name,
            roleTitle: s.role,
            employmentType: s.type,
            monthlySalaryPaise: s.salary,
            avatarColor: s.color,
          })
          .returning()
      )[0];

    staffIds[s.name] = staffRow.id;

    if (coachIds[s.name]) {
      await db
        .update(coaches)
        .set({ staffId: staffRow.id, updatedAt: new Date() })
        .where(eq(coaches.id, coachIds[s.name]));
    }

    const staffId = staffRow.id;
    if (staffId && payrollRunId) {
      await db.insert(payslips).values({
        payrollRunId,
        staffId,
        daysPresent: s.paid ? 26 : 14,
        daysExpected: s.type === "part_time" ? 16 : 26,
        amountPaise: s.salary,
        status: s.paid ? "paid" : "pending",
      }).onConflictDoNothing();
    }
  }

  const sampleVideoUrl = "/uploads/coach-media/sample-reference.mp4";

  const drillDefs = [
    { drill: "Single-leg takedown", player: "HRWR-1042", coach: "Naveen Kadyan", gradient: "linear-gradient(135deg, #0E1B33, #1E335C)", hoursAgo: 2, status: "pending" as const, published: false },
    { drill: "Jab–cross combo", player: "HRBX-0218", coach: "Sunita Rani", gradient: "linear-gradient(135deg, #7C5CFC, #A78BFA)", hoursAgo: 3, status: "pending" as const, published: false },
    { drill: "Block starts", player: "HRAT-0091", coach: "Vikram Malik", gradient: "linear-gradient(135deg, #2F6BFF, #5B8DEF)", hoursAgo: 5, status: "pending" as const, published: false },
    { drill: "Sprawl defense", player: "HRWR-1042", coach: "Naveen Kadyan", gradient: "linear-gradient(135deg, #7a2d12, #FF6B2C)", hoursAgo: 48, status: "reviewed" as const, published: true },
    { drill: "Double-leg entry", player: "HRWR-1042", coach: "Naveen Kadyan", gradient: "linear-gradient(135deg, #0E1B33, #2F6BFF)", hoursAgo: 72, status: "reviewed" as const, published: true },
  ];

  for (const d of drillDefs) {
    const publishedAt = d.published ? new Date(Date.now() - (d.hoursAgo - 1) * 3600000) : null;
    await db
      .insert(drillSubmissions)
      .values({
        academyId,
        playerId: playerIds[d.player],
        coachId: coachIds[d.coach],
        drillName: d.drill,
        videoUrl: sampleVideoUrl,
        thumbnailGradient: d.gradient,
        durationSeconds: 28,
        submittedAt: new Date(Date.now() - d.hoursAgo * 3600000),
        status: d.status,
        publishedAt,
        publishedByCoachId: d.published ? coachIds[d.coach] : null,
      })
      .onConflictDoNothing();
  }

  const reviewedRows = await db
    .select({ id: drillSubmissions.id, coachId: drillSubmissions.coachId })
    .from(drillSubmissions)
    .where(
      and(eq(drillSubmissions.academyId, academyId), eq(drillSubmissions.status, "reviewed"))
    );

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

  const [coachPostRow] = await db
    .insert(coachDrillPosts)
    .values({
      academyId,
      coachId: coachIds["Naveen Kadyan"],
      sportId: sportIds.Wrestling,
      batchId: batchIds["Wrestling-Sub-junior"],
      drillName: "Single-leg takedown · 3 × 10",
      description: "Focus on a clean level change and keep your back straight through the finish.",
      videoUrl: sampleVideoUrl,
      thumbnailGradient: "linear-gradient(135deg, #0E1B33, #1E335C)",
      durationSeconds: 35,
      postedAt: new Date(Date.now() - 12 * 3600000),
      publishedAt: new Date(Date.now() - 10 * 3600000),
      publishedByCoachId: coachIds["Naveen Kadyan"],
    })
    .returning({ id: coachDrillPosts.id });

  const publishedSubmissions = await db
    .select({ id: drillSubmissions.id })
    .from(drillSubmissions)
    .where(
      and(eq(drillSubmissions.academyId, academyId), eq(drillSubmissions.status, "reviewed"))
    );

  if (publishedSubmissions[0]) {
    await db
      .insert(mediaPostLikes)
      .values({
        academyId,
        itemType: "player_submission",
        itemId: publishedSubmissions[0].id,
        userId: adminId,
      })
      .onConflictDoNothing();

    await db
      .insert(mediaPostComments)
      .values({
        academyId,
        itemType: "player_submission",
        itemId: publishedSubmissions[0].id,
        userId: adminId,
        body: "Great form on this one!",
      })
      .onConflictDoNothing();
  }

  if (coachPostRow) {
    await db
      .insert(mediaPostLikes)
      .values({
        academyId,
        itemType: "coach_post",
        itemId: coachPostRow.id,
        userId: adminId,
      })
      .onConflictDoNothing();
  }

  const rohitPlayerId = playerIds["HRWR-1042"];
  const boxingPlayerId = playerIds["HRBX-0218"];
  if (rohitPlayerId && boxingPlayerId) {
    await db
      .insert(playerFollows)
      .values({
        academyId,
        followerPlayerId: rohitPlayerId,
        followedPlayerId: boxingPlayerId,
      })
      .onConflictDoNothing();
  }

  const activityDefs = [
    { actor: "Priya Dahiya", desc: "paid June fees — ₹1,500", type: "check", minsAgo: 12 },
    { actor: "6 drill videos", desc: "Coach Naveen reviewed", type: "video", minsAgo: 60, prefix: true },
    { actor: "2 new players", desc: "enrolled in Kabaddi", type: "users", minsAgo: 180 },
  ];

  for (const a of activityDefs) {
    await db.insert(activityEvents).values({
      academyId,
      eventType: a.type,
      actorName: a.actor,
      description: a.desc,
      metadata: { type: a.type, prefix: a.prefix ?? false },
      createdAt: new Date(Date.now() - a.minsAgo * 60000),
    }).onConflictDoNothing();
  }

  await db
    .insert(feeTargets)
    .values({
      academyId,
      period: "2026-06",
      targetPaise: 12000000,
    })
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

  console.log("Seed complete for academy:", academy.slug, "→", academy.id);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
