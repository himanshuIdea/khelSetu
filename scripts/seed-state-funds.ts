import { loadEnv } from "@/lib/load-env";
import { getStateAdminUserId } from "@/db/seed/bulk/admin-credentials";
import { seedStateFunds } from "@/db/seed/state-funds";

loadEnv();

async function main() {
  const stateAdminUserId = await getStateAdminUserId();
  await seedStateFunds(stateAdminUserId);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
