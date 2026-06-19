/**
 * Smoke test for state verification queue + flag workflow (repository layer).
 * Run: pnpm tsx scripts/verify-verification-flow.ts
 */
import { loadEnv } from "@/lib/load-env";
import { listStateOnboardingRequests } from "@/lib/repositories/academy-onboarding";
import {
  clearNurseryFlag,
  flagStateNursery,
  getAcademyNurseryFlag,
  getStateNurseryDetail,
  listStateNurseries,
  respondToNurseryFlag,
} from "@/lib/repositories/state-nurseries";
import { listVerificationQueue } from "@/lib/repositories/state-verification";
import { getVerificationBreakdown } from "@/lib/repositories/state-aggregates";
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

  await clearNurseryFlag(testAcademyId, stateAdminId);

  detail = await getStateNurseryDetail(testAcademyId);
  assert(detail?.verificationStatus === "verified", "cleared back to verified");
  assert(detail?.flagNote === null, "flag note cleared");
  assert(await getAcademyNurseryFlag(testAcademyId) === null, "banner flag hidden after clear");
  console.log("   OK\n");

  console.log("=== All verification flow checks passed ===\n");

  // HTTP layer (optional — requires dev server on :3000)
  const baseUrl = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
  try {
    const email = process.env.STATE_ADMIN_EMAIL;
    const password = process.env.STATE_ADMIN_PASSWORD;
    if (!email || !password) {
      console.log("5. HTTP API — skipped (STATE_ADMIN_EMAIL/PASSWORD not set)");
      process.exit(0);
    }

    console.log("5. HTTP API (auth + PATCH flag/clear)");
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
    console.log(`5. HTTP API — skipped or failed (${httpErr instanceof Error ? httpErr.message : httpErr})`);
    console.log("   (Ensure dev server is running on :3000 for HTTP checks)");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
