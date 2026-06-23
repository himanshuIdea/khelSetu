import { config } from "dotenv";

declare global {
  // eslint-disable-next-line no-var
  var __khelsetuEnvLoaded: boolean | undefined;
}

/** Load environment from `.env` then `.env.local` (project standard). Runs once per process. */
export function loadEnv() {
  if (globalThis.__khelsetuEnvLoaded) return;
  config({ path: ".env", quiet: true });
  config({ path: ".env.local", override: true, quiet: true });
  globalThis.__khelsetuEnvLoaded = true;
}
