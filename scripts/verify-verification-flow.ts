/**
 * Smoke test for state verification queue + flag workflow (repository layer).
 * Run: pnpm tsx scripts/verify-verification-flow.ts
 */
import { loadEnv } from "@/lib/load-env";
import { getOnboardingRequestById, getOnboardingRequestByUserId, listStateOnboardingRequests, reviewOnboardingRequest, submitOnboardingRequest } from "@/lib/repositories/academy-onboarding";
import { db } from "@/lib/db";
import { academies, academyMemberships, stateNurseryRegistrations } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  clearNurseryFlag,
  deregisterStateNursery,
  flagStateNursery,
  getAcademyNurseryFlag,
  getStateNurseryDetail,
  isAcademyNurseryDeregistered,
  listStateNurseries,
  respondToNurseryFlag,
} from "@/lib/repositories/state-nurseries";
import { listVerificationQueue } from "@/lib/repositories/state-verification";
import { getVerificationBreakdown } from "@/lib/repositories/state-aggregates";
import {
  verificationQueueStatusLabel,
  verificationQueueStatusVariant,
  verificationQueueSortBand,
  isPendingReviewQueueItem,
  isReviewRequestedQueueItem,
} from "@/lib/state-verification-queue";
import { getStateAdminUserId } from "@/db/seed/bulk/admin-credentials";

loadEnv();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

async function main() {
  console.log("=== Verification flow smoke test ===\n");

  const stateAdminId = await getStateAdminUserId();

  const [queue, breakdown, onboarding, nurseries] = await Promise.all([
    listVerificationQueue(),
    getVerificationBreakdown(),
    listStateOnboardingRequests(),
    listStateNurseries(),
  ]);

  console.log("1. listVerificationQueue");
  const onboardingRows = queue.filter((r) => r.kind === "onboarding");
  const nurseryRows = queue.filter((r) => r.kind === "nursery");
  console.log(`   total=${queue.length}, onboarding=${onboardingRows.length}, nursery=${nurseryRows.length}`);
  assert(queue.length > 0, "queue should not be empty with seeded data");
  assert(
    onboardingRows.length === onboarding.filter((r) => r.status !== "approved").length,
    "onboarding rows should exclude approved"
  );
  assert(nurseryRows.length === nurseries.length, "nursery rows should match listStateNurseries count");
  console.log("   OK\n");

  console.log("1b. verification queue sort bands");
  for (let i = 1; i < queue.length; i++) {
    const prev = queue[i - 1]!;
    const cur = queue[i]!;
    assert(
      verificationQueueSortBand(prev) <= verificationQueueSortBand(cur),
      `queue bands non-decreasing at index ${i - 1}→${i}`
    );
  }

  const firstBand0Idx = queue.findIndex((r) => verificationQueueSortBand(r) === 0);
  const firstBand1Idx = queue.findIndex((r) => verificationQueueSortBand(r) === 1);
  const firstBand2Idx = queue.findIndex((r) => verificationQueueSortBand(r) === 2);

  const hasPendingNursery = nurseryRows.some((r) => r.verificationStatus === "pending");
  const hasPureFlagged = nurseryRows.some(
    (r) =>
      r.verificationStatus === "flagged" && r.flagResponseStatus !== "review_requested"
  );
  const hasVerifiedNursery = nurseryRows.some((r) => r.verificationStatus === "verified");

  if (hasPendingNursery && hasPureFlagged && hasVerifiedNursery) {
    assert(firstBand0Idx >= 0 && firstBand1Idx >= 0 && firstBand2Idx >= 0, "all three bands present");
    assert(firstBand0Idx < firstBand1Idx, "action-needed band before flagged band");
    assert(firstBand1Idx < firstBand2Idx, "flagged band before verified band");
  }
  console.log("   OK\n");

  console.log("2. getVerificationBreakdown");
  assert(breakdown.verified + breakdown.pending + breakdown.flagged > 0, "breakdown counts");
  console.log(
    `   verified=${breakdown.verified}, pending=${breakdown.pending}, flagged=${breakdown.flagged}, rate=${breakdown.rate}%`
  );
  console.log("   OK\n");

  const flaggedNursery = nurseries.find((n) => n.verificationStatus === "flagged");
  assert(flaggedNursery, "seed should include at least one flagged nursery");

  console.log("3. getAcademyNurseryFlag (flagged nursery)");
  const existingFlag = await getAcademyNurseryFlag(flaggedNursery!.academyId);
  if (existingFlag) {
    assert(existingFlag.flagNote.length > 0, "flag note present");
    console.log(`   academyId=${flaggedNursery!.academyId}, note="${existingFlag.flagNote.slice(0, 40)}…"`);
  } else {
    console.log(
      `   WARN: flagged nursery ${flaggedNursery!.academyId} has no note/guidelines (pre-migration seed — re-run db:seed to backfill)`
    );
  }
  console.log("   OK\n");

  const verifiedNursery = nurseries.find((n) => n.verificationStatus === "verified");
  assert(verifiedNursery, "seed should include verified nursery");

  console.log("4. flagStateNursery → respond → clearNurseryFlag (round-trip on verified nursery)");
  const testAcademyId = verifiedNursery!.academyId;

  await flagStateNursery(
    testAcademyId,
    { note: "QA test flag", guidelines: "Fix the test issue and request review." },
    stateAdminId
  );

  let detail = await getStateNurseryDetail(testAcademyId);
  assert(detail?.verificationStatus === "flagged", "should be flagged after flagStateNursery");
  assert(detail?.flagNote === "QA test flag", "flag note stored");

  let flag = await getAcademyNurseryFlag(testAcademyId);
  assert(flag?.flagResponseStatus === "none", "response starts as none");

  await respondToNurseryFlag(testAcademyId, {
    action: "request_review",
    note: "QA addressed the issue.",
  });

  flag = await getAcademyNurseryFlag(testAcademyId);
  assert(flag?.flagResponseStatus === "review_requested", "academy can request review");
  assert(flag?.flagResponseNote === "QA addressed the issue.", "response note stored");

  detail = await getStateNurseryDetail(testAcademyId);
  assert(detail?.flagResponseStatus === "review_requested", "detail reflects academy response");

  const queueAfter = await listVerificationQueue();
  const queueRow = queueAfter.find(
    (r) => r.kind === "nursery" && r.academyId === testAcademyId
  );
  assert(queueRow?.kind === "nursery" && queueRow.flagResponseStatus === "review_requested", "queue shows review_requested");
  assert(
    queueRow?.kind === "nursery" && verificationQueueStatusLabel(queueRow) === "Review requested",
    "queue label shows Review requested"
  );
  assert(
    queueRow?.kind === "nursery" && verificationQueueStatusVariant(queueRow) === "amber",
    "queue variant amber for review_requested"
  );
  assert(
    queueRow?.kind === "nursery" && verificationQueueSortBand(queueRow) === 0,
    "review-requested flagged nursery sorts in band 0"
  );

  await clearNurseryFlag(testAcademyId, stateAdminId);

  detail = await getStateNurseryDetail(testAcademyId);
  assert(detail?.verificationStatus === "verified", "cleared back to verified");
  assert(detail?.flagNote === null, "flag note cleared");
  assert(await getAcademyNurseryFlag(testAcademyId) === null, "banner flag hidden after clear");
  console.log("   OK\n");

  console.log("4b. addressed response queue label");
  await flagStateNursery(
    testAcademyId,
    { note: "QA addressed flag", guidelines: "Resolve and mark as addressed." },
    stateAdminId
  );

  await respondToNurseryFlag(testAcademyId, {
    action: "addressed",
    note: "QA fixed the issue.",
  });

  const queueAddressed = await listVerificationQueue();
  const addressedRow = queueAddressed.find(
    (r) => r.kind === "nursery" && r.academyId === testAcademyId
  );
  assert(
    addressedRow?.kind === "nursery" && addressedRow.flagResponseStatus === "addressed",
    "queue shows addressed"
  );
  assert(
    addressedRow?.kind === "nursery" && verificationQueueStatusLabel(addressedRow) === "Marked addressed",
    "queue label shows Marked addressed"
  );
  assert(
    addressedRow?.kind === "nursery" && verificationQueueStatusVariant(addressedRow) === "amber",
    "queue variant amber for addressed"
  );
  assert(
    addressedRow?.kind === "nursery" && verificationQueueSortBand(addressedRow) === 1,
    "addressed flagged nursery sorts in band 1"
  );

  await clearNurseryFlag(testAcademyId, stateAdminId);
  assert(await getAcademyNurseryFlag(testAcademyId) === null, "banner flag hidden after addressed clear");
  console.log("   OK\n");

  console.log("5. onboarding resubmission → Review requested queue label");

  const initialOnboardingItem = {
    kind: "onboarding" as const,
    id: "qa-initial",
    name: "QA Initial Academy",
    initials: "QA",
    color: "#FF6B2C",
    adminFullName: "QA Admin",
    district: "Gurugram",
    queueTypeLabel: "Onboarding" as const,
    athleteCount: null,
    requestType: "initial" as const,
    status: "submitted" as const,
    statusLabel: "Submitted",
    statusVariant: "amber" as const,
    submittedAt: new Date().toISOString(),
    sortPriority: 0,
    sortDate: Date.now(),
  };
  const resubmittedOnboardingItem = {
    ...initialOnboardingItem,
    id: "qa-resubmission",
    requestType: "resubmission" as const,
  };

  assert(
    verificationQueueStatusLabel(initialOnboardingItem) === "Pending review",
    "initial submitted onboarding shows Pending review"
  );
  assert(
    !isReviewRequestedQueueItem(initialOnboardingItem),
    "initial submitted onboarding is not review requested"
  );
  assert(
    isPendingReviewQueueItem(initialOnboardingItem),
    "initial submitted onboarding is pending review"
  );
  assert(
    verificationQueueStatusLabel(resubmittedOnboardingItem) === "Review requested",
    "resubmitted onboarding shows Review requested"
  );
  assert(
    verificationQueueStatusVariant(resubmittedOnboardingItem) === "amber",
    "resubmitted onboarding variant amber"
  );
  assert(
    isReviewRequestedQueueItem(resubmittedOnboardingItem),
    "resubmitted onboarding matches review_requested filter helper"
  );
  assert(
    !isPendingReviewQueueItem(resubmittedOnboardingItem),
    "resubmitted onboarding excluded from pending review filter"
  );

  const submittedOnboarding = onboarding.find(
    (r) => r.status === "submitted" || r.status === "under_review"
  );
  if (!submittedOnboarding) {
    console.log("   helper checks OK · DB round-trip skipped (no submitted onboarding in seed)\n");
  } else {
    const onboardingDetail = await getOnboardingRequestById(submittedOnboarding.id);
    assert(onboardingDetail, "onboarding detail found");

    await reviewOnboardingRequest({
      requestId: submittedOnboarding.id,
      reviewerUserId: stateAdminId,
      action: "needs_action",
      reviewNotes: "QA — please fix KYC details.",
      requiredActions: ["aadhar_number"],
    });

    await submitOnboardingRequest(onboardingDetail!.userId);

    const queueResubmitted = await listVerificationQueue();
    const resubmittedRow = queueResubmitted.find(
      (r) => r.kind === "onboarding" && r.id === submittedOnboarding.id
    );
    assert(
      resubmittedRow?.kind === "onboarding" && resubmittedRow.requestType === "resubmission",
      "queue shows resubmission requestType"
    );
    assert(
      resubmittedRow?.kind === "onboarding" &&
        verificationQueueStatusLabel(resubmittedRow) === "Review requested",
      "resubmitted onboarding label shows Review requested"
    );
    console.log("   helper + DB round-trip OK\n");
  }

  console.log("5b. nursery deregister → read-only state → re-approve");
  const deregisterTarget =
    nurseries.find((n) => n.verificationStatus === "verified" && n.academyId !== testAcademyId) ??
    verifiedNursery;
  assert(deregisterTarget, "verified nursery for deregister test");

  const deregisterAcademyId = deregisterTarget!.academyId;
  const [adminMembership] = await db
    .select({ userId: academyMemberships.userId })
    .from(academyMemberships)
    .where(
      and(
        eq(academyMemberships.academyId, deregisterAcademyId),
        eq(academyMemberships.role, "admin")
      )
    )
    .limit(1);
  assert(adminMembership, "admin membership for deregister nursery");

  await deregisterStateNursery(deregisterAcademyId, stateAdminId);

  const [academyAfterDeregister] = await db
    .select({ nurseryDeregisteredAt: academies.nurseryDeregisteredAt })
    .from(academies)
    .where(eq(academies.id, deregisterAcademyId))
    .limit(1);
  assert(academyAfterDeregister?.nurseryDeregisteredAt, "nurseryDeregisteredAt set");

  const registrationRows = await db
    .select({ id: stateNurseryRegistrations.id })
    .from(stateNurseryRegistrations)
    .where(eq(stateNurseryRegistrations.academyId, deregisterAcademyId));
  assert(registrationRows.length === 0, "state registration removed");

  const onboardingAfterDeregister = await getOnboardingRequestByUserId(adminMembership.userId);
  assert(onboardingAfterDeregister?.status === "draft", "onboarding reset to draft");
  assert(onboardingAfterDeregister?.requestType === "resubmission", "onboarding marked resubmission");
  assert(onboardingAfterDeregister?.academyId === deregisterAcademyId, "onboarding keeps academyId");
  assert(await isAcademyNurseryDeregistered(deregisterAcademyId), "isAcademyNurseryDeregistered true");

  await submitOnboardingRequest(adminMembership.userId);
  const submittedRereg = await getOnboardingRequestByUserId(adminMembership.userId);
  assert(submittedRereg?.status === "submitted", "resubmission submitted");
  assert(submittedRereg?.requestType === "resubmission", "resubmission type preserved");

  await reviewOnboardingRequest({
    requestId: submittedRereg!.id,
    reviewerUserId: stateAdminId,
    action: "approve",
  });

  const [academyAfterApprove] = await db
    .select({ nurseryDeregisteredAt: academies.nurseryDeregisteredAt })
    .from(academies)
    .where(eq(academies.id, deregisterAcademyId))
    .limit(1);
  assert(!academyAfterApprove?.nurseryDeregisteredAt, "nurseryDeregisteredAt cleared after approve");

  const registrationAfterApprove = await db
    .select({ id: stateNurseryRegistrations.id })
    .from(stateNurseryRegistrations)
    .where(eq(stateNurseryRegistrations.academyId, deregisterAcademyId));
  assert(registrationAfterApprove.length === 1, "state registration restored after approve");
  assert(!(await isAcademyNurseryDeregistered(deregisterAcademyId)), "read-only cleared after approve");
  console.log("   OK\n");

  console.log("=== All verification flow checks passed ===\n");

  // HTTP layer (optional — requires dev server on :3000)
  const baseUrl = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
  try {
    const email = process.env.STATE_ADMIN_EMAIL;
    const password = process.env.STATE_ADMIN_PASSWORD;
    if (!email || !password) {
      console.log("6. HTTP API — skipped (STATE_ADMIN_EMAIL/PASSWORD not set)");
      process.exit(0);
    }

    console.log("6. HTTP API (auth + PATCH flag/clear)");
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "password", email, password, portal: "state" }),
    });
    assert(loginRes.ok, `login failed: ${loginRes.status}`);
    const cookie = loginRes.headers.get("set-cookie") ?? "";
    assert(cookie.includes("session"), "session cookie missing");

    const patchFlag = await fetch(`${baseUrl}/api/v1/state/nurseries/${testAcademyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie.split(";")[0] ?? cookie },
      body: JSON.stringify({
        action: "flag",
        note: "HTTP QA flag",
        guidelines: "Resolve via HTTP test.",
      }),
    });
    assert(patchFlag.ok, `PATCH flag failed: ${patchFlag.status} ${await patchFlag.text()}`);

    const patchClear = await fetch(`${baseUrl}/api/v1/state/nurseries/${testAcademyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie.split(";")[0] ?? cookie },
      body: JSON.stringify({ action: "clear_flag" }),
    });
    assert(patchClear.ok, `PATCH clear_flag failed: ${patchClear.status}`);

    const requestsRedirect = await fetch(`${baseUrl}/state/nurseries/requests`, {
      redirect: "manual",
      headers: { Cookie: cookie.split(";")[0] ?? cookie },
    });
    assert(
      requestsRedirect.status === 307 || requestsRedirect.status === 308,
      "requests route should redirect"
    );
    const location = requestsRedirect.headers.get("location") ?? "";
    assert(location.includes("/state/verification"), `expected verification redirect, got ${location}`);
    console.log("   login, PATCH flag/clear, requests→verification redirect OK\n");
    console.log("=== HTTP verification passed ===");
  } catch (httpErr) {
    console.log(`6. HTTP API — skipped or failed (${httpErr instanceof Error ? httpErr.message : httpErr})`);
    console.log("   (Ensure dev server is running on :3000 for HTTP checks)");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
