import { test, expect } from "@playwright/test";
import { requireStateAdminCredentials } from "./helpers/credentials";
import {
  clearStateSearch,
  closeModal,
  hold,
  holdGlance,
  openPdfInNewTab,
  pickInlineSelect,
  scrollLanding,
  scrollMain,
  scrollModal,
  sidebarNav,
  slowType,
  stateSearch,
} from "./helpers/demo-actions";

test.describe.configure({ mode: "serial" });

test("state portal demo — in-depth cinematic tour", async ({ page, context }) => {
  const { email, password } = requireStateAdminCredentials();

  // ── Act 1: Marketing landing ─────────────────────────────────────────────
  // Step 1
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "KhelSetu", level: 1 })).toBeVisible();
  await hold(page, 5_000);

  // Step 2
  const languageToggle = page.getByRole("button", {
    name: /Switch page content to Hindi/i,
  });
  await languageToggle.click();
  await hold(page, 5_000);

  // Step 3
  await page.getByRole("button", { name: /Switch page content to English/i }).click();
  await hold(page, 4_000);

  // Step 4 — staged scroll through landing sections
  await scrollLanding(page);

  // Step 5 — Sign in (desktop rail at lg+)
  await page.getByRole("link", { name: /^Sign in$/i }).first().click();
  await expect(page).toHaveURL(/\/auth\/state\/login/);
  await hold(page, 4_000);

  // ── Act 2: Login ─────────────────────────────────────────────────────────
  // Step 6
  await expect(page.getByRole("heading", { name: /State dashboard sign in/i })).toBeVisible();
  await hold(page, 4_000);

  // Step 7
  const emailField = page.getByRole("textbox", { name: /you@/i });
  const passwordField = page.getByRole("textbox", { name: /password/i });
  await slowType(emailField, email);
  await slowType(passwordField, password);

  // Step 8
  await page.getByRole("button", { name: /^Continue$/i }).click();
  await page.waitForURL(/\/state/, { timeout: 60_000 });
  await hold(page, 5_000);

  // ── Act 3: State overview (glance) ─────────────────────────────────────────
  // Step 9
  await expect(page).toHaveURL(/\/state\/overview/);
  await hold(page, 5_000);

  // Step 10
  await scrollMain(page, 280);
  await holdGlance(page);

  // ── Act 4: Sports nurseries ────────────────────────────────────────────────
  // Step 12
  await sidebarNav(page, "Sports nurseries");
  await expect(page).toHaveURL(/\/state\/nurseries$/);

  // Step 13
  await hold(page, 4_000);

  // Step 14
  await stateSearch(page, "Search sports nurseries", "sonipat");
  await hold(page, 6_000);

  // Step 15
  await hold(page, 4_000);

  // Step 16
  await clearStateSearch(page, "Search sports nurseries");

  // ── Act 5: Athletes ────────────────────────────────────────────────────────
  // Step 17
  await sidebarNav(page, "Athletes");
  await expect(page).toHaveURL(/\/state\/athletes/);

  // Step 18
  await pickInlineSelect(page, /^All sports$/i, /^Wrestling$/i);

  // Step 19
  await pickInlineSelect(page, /^District: All$/i, /^Sonipat$/i);

  // Step 20
  const ratingSlider = page.getByRole("slider", { name: /Minimum KhelSetu rating/i });
  await ratingSlider.fill("8.5");
  await hold(page, 6_000);

  // Step 22
  await hold(page, 5_000);

  // ── Act 6: Talent scouting ─────────────────────────────────────────────────
  // Step 23
  await sidebarNav(page, "Talent scouting");
  await expect(page).toHaveURL(/\/state\/scouting/);

  // Step 24
  await stateSearch(page, "Search athletes by name", "deepanshu");
  await page.waitForTimeout(800);
  await hold(page, 6_000);

  // Step 25–26 — set Khelo India status for Deepanshu (desktop table)
  const deepanshuStatus = page
    .locator("table")
    .getByRole("button", { name: /Status for Deepanshu/i });
  await expect(deepanshuStatus).toBeVisible();
  await hold(page, 5_000);
  await deepanshuStatus.click();
  await page.getByRole("listbox").getByRole("button", { name: /^Khelo India$/i }).click();
  await hold(page, 6_000);

  // Step 27
  await expect(deepanshuStatus).toContainText(/Khelo India/i);
  await hold(page, 5_000);

  // Step 28
  await hold(page, 4_000);

  // ── Act 7: Verification ────────────────────────────────────────────────────
  // Step 29
  await sidebarNav(page, "Verification");
  await expect(page).toHaveURL(/\/state\/verification/);

  // Step 30
  await hold(page, 5_000);

  // Step 31 — first queue row opens review modal (Review is in row, not a button)
  await page.locator("table tbody tr").first().click();
  await hold(page, 5_000);

  // Step 32
  await scrollModal(page);

  // Step 33
  await closeModal(page);

  // ── Act 8: Fund utilisation ────────────────────────────────────────────────
  // Step 34
  await sidebarNav(page, "Fund utilisation");
  await expect(page).toHaveURL(/\/state\/funds$/);

  // Step 35
  await hold(page, 5_000);

  // Step 36
  await page.getByRole("row", { name: /Padak Lao/i }).click();
  await expect(page).toHaveURL(/\/state\/funds\/padak-lao/);
  await hold(page, 6_000);

  // Step 37 — pause on header only, no scroll
  await hold(page, 6_000);

  // Step 38
  await page.getByRole("link", { name: /Back to funds/i }).click();
  await expect(page).toHaveURL(/\/state\/funds$/);
  await hold(page, 4_000);

  // ── Act 9: Districts ───────────────────────────────────────────────────────
  // Step 39
  await sidebarNav(page, "Districts");
  await expect(page).toHaveURL(/\/state\/districts/);

  // Step 40
  await stateSearch(page, "Search districts", "Sonipat");
  await hold(page, 6_000);

  // Step 41
  await scrollMain(page, 200);
  await hold(page, 5_000);

  // ── Act 10: Reports + PDF ──────────────────────────────────────────────────
  // Step 42
  await sidebarNav(page, "Reports");
  await expect(page).toHaveURL(/\/state\/reports/);

  // Step 43
  await hold(page, 5_000);

  // Step 44 — Full state report (featured card is first Generate)
  await page.getByRole("button", { name: /Generate →/i }).first().click();
  await hold(page, 4_000);

  // Step 45
  await page.getByRole("button", { name: /^PDF$/i }).click();
  await hold(page, 4_000);

  // Step 46–47 — download and briefly open PDF in new tab
  const downloadPromise = page.waitForEvent("download", { timeout: 120_000 });
  await page.getByRole("button", { name: /Download report/i }).click();
  const download = await downloadPromise;
  await openPdfInNewTab(context, download);
  await holdGlance(page, 1_500);

  // Step 48
  await sidebarNav(page, "State overview");
  await expect(page).toHaveURL(/\/state\/overview/);
  await hold(page, 4_000);
});
