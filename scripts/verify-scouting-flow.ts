import { loadEnv } from "@/lib/load-env";
import { generateShortlistXlsx } from "@/lib/scouting-shortlist-report";
import {
  getStateScoutingDashboard,
  listShortlistReportRows,
  listStateScoutingProspects,
  updatePlayerScoutingStatus,
} from "@/lib/repositories/state-scouting";

loadEnv();

async function main() {
  const before = await getStateScoutingDashboard();
  const prospects = await listStateScoutingProspects();

  if (prospects.length === 0) {
    console.log("SKIP: no prospects in state nursery scope");
    process.exit(0);
  }

  const target = prospects[0]!;
  await updatePlayerScoutingStatus(target.playerId, "khelo_india");

  const after = await getStateScoutingDashboard();
  if (after.prospectsIdentified <= before.prospectsIdentified) {
    throw new Error("Expected prospectsIdentified to increase after status assignment");
  }

  await updatePlayerScoutingStatus(target.playerId, "shortlisted_for_states");

  const rows = await listShortlistReportRows();
  if (rows.length === 0) {
    throw new Error("Expected shortlist report rows after marking statuses");
  }

  const { buffer } = await generateShortlistXlsx(rows);
  if (buffer.length < 100) {
    throw new Error("Expected non-trivial XLSX buffer");
  }

  await updatePlayerScoutingStatus(target.playerId, null);

  console.log("verify-scouting-flow: OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
