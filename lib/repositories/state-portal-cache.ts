import { revalidateTag, unstable_cache } from "next/cache";

/** Shared cache tags for state portal read paths (Vercel/serverless). */
export const STATE_NURSERY_CONTEXT_TAG = "state-nursery-context";
export const STATE_FISCAL_YEAR_TAG = "state-fiscal-year";

/** Nursery verification map — changes infrequently; 30s TTL cuts cold DB round-trips. */
export function cacheStateNurseryVerification<T>(fetcher: () => Promise<T>): Promise<T> {
  return unstable_cache(fetcher, ["state-nursery-verification-v1"], {
    revalidate: 30,
    tags: [STATE_NURSERY_CONTEXT_TAG],
  })();
}

/** Active fiscal year row — rarely changes during a session. */
export function cacheStateActiveFiscalYear<T>(fetcher: () => Promise<T>): Promise<T> {
  return unstable_cache(fetcher, ["state-active-fiscal-year-v1"], {
    revalidate: 60,
    tags: [STATE_FISCAL_YEAR_TAG],
  })();
}

export function revalidateStateActiveFiscalYearCache() {
  revalidateTag(STATE_FISCAL_YEAR_TAG, "max");
}

export function revalidateStateNurseryContextCache() {
  revalidateTag(STATE_NURSERY_CONTEXT_TAG, "max");
}
