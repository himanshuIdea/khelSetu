import { config } from "dotenv";

/** Load environment from `.env` (project standard). */
export function loadEnv() {
  config({ path: ".env" });
}
