import {
  getActiveTournament,
  getActiveTournamentId,
  getBracketMatches,
  getMatSchedule,
  getTournamentMedals,
} from "@/lib/repositories/tournaments";
import {
  getFeaturedTeam,
  getLineupSuggestion,
  getOtherTeams,
  getTeamMembers,
} from "@/lib/repositories/teams";
import { loadEnv } from "../../lib/load-env";
import { createService } from "../shared/create-service";
import { servicePorts } from "../shared/config";

loadEnv();

createService({
  name: "competitions-service",
  port: servicePorts.competitions,
  dbHealth: true,
  routes: (app) => {
    app.get("/academies/:academyId/teams/featured", async (c) => {
      const team = await getFeaturedTeam(c.req.param("academyId"));
      if (!team) return c.json({ error: "No team found" }, 404);
      return c.json({
        ...team,
        createdAt: team.createdAt.toISOString(),
        nextFixture: team.nextFixture
          ? { ...team.nextFixture, scheduledAt: team.nextFixture.scheduledAt.toISOString() }
          : null,
      });
    });

    app.get("/academies/:academyId/teams/lineup-suggestion", async (c) => {
      const teamId = c.req.query("teamId");
      const suggestion = await getLineupSuggestion(c.req.param("academyId"), teamId);
      return c.json(suggestion);
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

    app.get("/tournaments/:tournamentId/medals", async (c) => {
      const academyId = c.req.query("academyId");
      if (!academyId) return c.json({ error: "academyId required" }, 400);
      const medals = await getTournamentMedals(c.req.param("tournamentId"), academyId);
      return c.json(medals);
    });
  },
});
