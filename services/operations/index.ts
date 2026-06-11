import { getAttendanceSessions } from "@/lib/repositories/attendance";
import {
  getDashboardStats,
  getPlayersBySport,
  getRecentActivity,
  getTodaySessions,
} from "@/lib/repositories/dashboard";
import { loadEnv } from "../../lib/load-env";
import { createService } from "../shared/create-service";
import { servicePorts } from "../shared/config";

loadEnv();

createService({
  name: "operations-service",
  port: servicePorts.operations,
  routes: (app) => {
    app.get("/academies/:academyId/dashboard/stats", async (c) => {
      const stats = await getDashboardStats(c.req.param("academyId"));
      return c.json(stats);
    });

    app.get("/academies/:academyId/dashboard/players-by-sport", async (c) => {
      const data = await getPlayersBySport(c.req.param("academyId"));
      return c.json(data);
    });

    app.get("/academies/:academyId/dashboard/today-sessions", async (c) => {
      const sessions = await getTodaySessions(c.req.param("academyId"));
      return c.json(sessions);
    });

    app.get("/academies/:academyId/dashboard/activity", async (c) => {
      const activity = await getRecentActivity(c.req.param("academyId"));
      return c.json(activity);
    });

    app.get("/academies/:academyId/attendance/sessions", async (c) => {
      const sessions = await getAttendanceSessions(c.req.param("academyId"));
      return c.json(sessions);
    });
  },
});
