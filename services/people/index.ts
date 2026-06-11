import { getCoachCount, getCoaches, getPendingReviews } from "@/lib/repositories/coaches";
import { getPlayerCounts, getPlayerDetail, getPlayers } from "@/lib/repositories/players";
import { loadEnv } from "../../lib/load-env";
import { createService } from "../shared/create-service";
import { servicePorts } from "../shared/config";

loadEnv();

createService({
  name: "people-service",
  port: servicePorts.people,
  routes: (app) => {
    app.get("/academies/:academyId/players", async (c) => {
      const players = await getPlayers(c.req.param("academyId"));
      return c.json(players);
    });

    app.get("/academies/:academyId/players/counts", async (c) => {
      const counts = await getPlayerCounts(c.req.param("academyId"));
      return c.json(counts);
    });

    app.get("/academies/:academyId/players/:externalId", async (c) => {
      const player = await getPlayerDetail(
        c.req.param("academyId"),
        c.req.param("externalId")
      );
      if (!player) return c.json({ error: "Player not found" }, 404);
      return c.json(player);
    });

    app.get("/academies/:academyId/coaches", async (c) => {
      const coaches = await getCoaches(c.req.param("academyId"));
      return c.json(coaches);
    });

    app.get("/academies/:academyId/coaches/count", async (c) => {
      const count = await getCoachCount(c.req.param("academyId"));
      return c.json({ count });
    });

    app.get("/academies/:academyId/coaches/pending-reviews", async (c) => {
      const reviews = await getPendingReviews(c.req.param("academyId"));
      return c.json(reviews);
    });
  },
});
