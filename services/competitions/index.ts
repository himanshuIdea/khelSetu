import {
  getActiveTournament,
  getActiveTournamentId,
  getBracketMatches,
  getMatSchedule,
} from "@/lib/repositories/tournaments";
import { getFeaturedTeam, getOtherTeams, getTeamMembers } from "@/lib/repositories/teams";
import { loadEnv } from "../../lib/load-env";
import { createService } from "../shared/create-service";
import { servicePorts } from "../shared/config";

loadEnv();

createService({
  name: "competitions-service",
  port: servicePorts.competitions,
  routes: (app) => {
    app.get("/academies/:academyId/teams/featured", async (c) => {
      const team = await getFeaturedTeam(c.req.param("academyId"));
      if (!team) return c.json({ error: "No team found" }, 404);
      return c.json({
        ...team,
        createdAt: team.createdAt.toISOString(),
      });
    });

    app.get("/academies/:academyId/teams/members", async (c) => {
      const teamId = c.req.query("teamId");
      const members = await getTeamMembers(c.req.param("academyId"), teamId);
      return c.json(members);
    });

    app.get("/academies/:academyId/teams", async (c) => {
      const excludeTeamId = c.req.query("excludeTeamId");
      const teams = await getOtherTeams(c.req.param("academyId"), excludeTeamId);
      return c.json(teams);
    });

    app.get("/academies/:academyId/tournaments/active", async (c) => {
      const tournament = await getActiveTournament(c.req.param("academyId"));
      if (!tournament) return c.json(null);
      return c.json({
        ...tournament,
        startDate: tournament.startDate.toISOString(),
        endDate: tournament.endDate.toISOString(),
      });
    });

    app.get("/academies/:academyId/tournaments/active/id", async (c) => {
      const id = await getActiveTournamentId(c.req.param("academyId"));
      return c.json({ id });
    });

    app.get("/tournaments/:tournamentId/bracket", async (c) => {
      const matches = await getBracketMatches(c.req.param("tournamentId"));
      return c.json(matches);
    });

    app.get("/tournaments/:tournamentId/mat-schedule", async (c) => {
      const schedule = await getMatSchedule(c.req.param("tournamentId"));
      return c.json(schedule);
    });
  },
});
