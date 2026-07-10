import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { BrowserContext, Download, Locator, Page } from "@playwright/test";

const projectRoot = process.cwd();

/** Cinematic hold — default 4s for key beats. */
export async function hold(page: Page, ms = 4_000) {
  await page.waitForTimeout(ms);
}

/** Shorter pause for glance screens. */
export async function holdGlance(page: Page, ms = 2_000) {
  await page.waitForTimeout(ms);
}

/** Type visibly for demo recordings. */
export async function slowType(locator: Locator, text: string, delayMs = 80) {
  await locator.click();
  await locator.fill("");
  await locator.pressSequentially(text, { delay: delayMs });
}

/** Staged scroll on the state marketing landing page. */
export async function scrollLanding(page: Page) {
  const stops = [0.35, 0.62, 0.88, 1];
  for (const ratio of stops) {
    await page.evaluate((r) => {
      const max = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        0
      );
      window.scrollTo({ top: max * r, behavior: "smooth" });
    }, ratio);
    await hold(page, 5_000);
  }
}

/** Fill the state portal top-bar search (aria-label = placeholder). */
export async function stateSearch(page: Page, placeholderPart: string, term: string) {
  const pattern = new RegExp(placeholderPart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const search = page.getByRole("searchbox", { name: pattern });
  await search.waitFor({ state: "visible", timeout: 30_000 });
  await slowType(search, term);
  await page.waitForTimeout(500);
}

export async function clearStateSearch(page: Page, placeholderPart: string) {
  const pattern = new RegExp(placeholderPart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const search = page.getByRole("searchbox", { name: pattern });
  await search.waitFor({ state: "visible", timeout: 30_000 });
  await search.fill("");
  await holdGlance(page);
}

/** Open an InlineSelect pill/input and pick a portaled option. */
export async function pickInlineSelect(
  page: Page,
  triggerName: string | RegExp,
  optionName: string | RegExp
) {
  await page.getByRole("button", { name: triggerName }).click();
  await page.getByRole("listbox").getByRole("button", { name: optionName }).click();
  await holdGlance(page, 1_500);
}

export async function scrollMain(page: Page, amount = 320) {
  await page.evaluate((scrollTop) => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTo({ top: Math.min(scrollTop, main.scrollHeight), behavior: "smooth" });
    }
  }, amount);
  await holdGlance(page, 1_500);
}

export async function scrollModal(page: Page) {
  const modal = page
    .locator('[role="dialog"], [aria-labelledby="onboarding-request-title"], [aria-labelledby="verification-nursery-title"]')
    .first();
  if (await modal.isVisible().catch(() => false)) {
    await modal.evaluate((el) => {
      const scrollable = el.querySelector("[class*='overflow']") ?? el;
      scrollable.scrollTo({ top: Math.min(280, scrollable.scrollHeight), behavior: "smooth" });
    });
    await hold(page, 4_000);
    await modal.evaluate((el) => {
      const scrollable = el.querySelector("[class*='overflow']") ?? el;
      scrollable.scrollTo({ top: scrollable.scrollHeight, behavior: "smooth" });
    });
    await hold(page, 5_000);
  }
}

export async function closeModal(page: Page) {
  const dialog = page.getByRole("dialog");
  const footerClose = dialog.locator("button").filter({ hasText: /^Close$/ });
  if (await footerClose.isVisible().catch(() => false)) {
    await footerClose.click();
  } else {
    await page.keyboard.press("Escape");
  }
  await holdGlance(page);
}

export async function sidebarNav(page: Page, label: string) {
  await page.getByRole("link", { name: label, exact: true }).click();
  await holdGlance(page, 2_500);
}

/** Save downloaded PDF and briefly open it in a new browser tab. */
export async function openPdfInNewTab(
  context: BrowserContext,
  download: Download,
  filename = "full-state-report.pdf"
) {
  const destDir = path.join(projectRoot, "e2e", "demo", "downloads");
  mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, filename);
  await download.saveAs(dest);

  const pdfBytes = readFileSync(dest);
  const base64 = pdfBytes.toString("base64");
  const pdfPage = await context.newPage();
  await pdfPage.setContent(
    `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Full state report</title></head>
<body style="margin:0;background:#323639">
<embed src="data:application/pdf;base64,${base64}" type="application/pdf" width="100%" height="100%" style="position:fixed;inset:0" />
</body>
</html>`,
    { waitUntil: "domcontentloaded" }
  );
  await pdfPage.waitForTimeout(2_500);
  await pdfPage.close();

  return dest;
}
