import { config } from "dotenv";

/** Load environment from `.env` then `.env.local` (project standard). */
export function loadEnv() {
  config({ path: ".env" });
  config({ path: ".env.local", override: true });
}
