/**
 * State portal read-path caching for Vercel/serverless.
 *
 * Do NOT use Next.js `unstable_cache` here — on `force-dynamic` state routes it
 * calls Vercel Runtime Cache (`incrementalCache.get`), which has hung until the
 * 60s function cap (Status 0 / loading skeleton). React `cache()` handles
 * per-request dedup; this module adds a short TTL across warm instances.
 */

export const STATE_NURSERY_CONTEXT_TAG = "state-nursery-context";
export const STATE_FISCAL_YEAR_TAG = "state-fiscal-year";
export const STATE_OVERVIEW_TAG = "state-overview";

type CacheSlot<T> = { value: T; expiresAt: number };

const NURSERY_TTL_MS = 30_000;
const FY_TTL_MS = 60_000;
const OVERVIEW_TTL_MS = 120_000;

const nurserySlot: { current?: CacheSlot<unknown> } = {};
const fiscalYearSlot: { current?: CacheSlot<unknown> } = {};
const overviewSlot: { current?: CacheSlot<unknown> } = {};

function readSlot<T>(slot: { current?: CacheSlot<unknown> }): T | undefined {
  const entry = slot.current;
  if (!entry || entry.expiresAt <= Date.now()) return undefined;
  return entry.value as T;
}

function writeSlot<T>(slot: { current?: CacheSlot<unknown> }, value: T, ttlMs: number) {
  slot.current = { value, expiresAt: Date.now() + ttlMs };
}

/** Nursery verification map — 30s TTL on warm serverless instances. */
export async function cacheStateNurseryVerification<T>(fetcher: () => Promise<T>): Promise<T> {
  const cached = readSlot<T>(nurserySlot);
  if (cached !== undefined) return cached;

  const value = await fetcher();
  writeSlot(nurserySlot, value, NURSERY_TTL_MS);
  return value;
}

/** Active fiscal year row — 60s TTL on warm serverless instances. */
export async function cacheStateActiveFiscalYear<T>(fetcher: () => Promise<T>): Promise<T> {
  const cached = readSlot<T>(fiscalYearSlot);
  if (cached !== undefined) return cached;

  const value = await fetcher();
  writeSlot(fiscalYearSlot, value, FY_TTL_MS);
  return value;
}

/** State overview dashboard — 120s TTL on warm serverless instances. */
export async function cacheStateOverviewSnapshot<T>(fetcher: () => Promise<T>): Promise<T> {
  const cached = readSlot<T>(overviewSlot);
  if (cached !== undefined) return cached;

  const value = await fetcher();
  writeSlot(overviewSlot, value, OVERVIEW_TTL_MS);
  return value;
}

export function revalidateStateOverviewCache() {
  overviewSlot.current = undefined;
}

export function revalidateStateActiveFiscalYearCache() {
  fiscalYearSlot.current = undefined;
  revalidateStateOverviewCache();
}

export function revalidateStateNurseryContextCache() {
  nurserySlot.current = undefined;
  revalidateStateOverviewCache();
}
