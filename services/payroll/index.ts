import { getPayrollStats, getStaffMembers } from "@/lib/repositories/payroll";
import { loadEnv } from "../../lib/load-env";
import { createService } from "../shared/create-service";
import { servicePorts } from "../shared/config";

loadEnv();

createService({
  name: "payroll-service",
  port: servicePorts.payroll,
  dbHealth: true,
  routes: (app) => {
    app.get("/academies/:academyId/payroll/stats", async (c) => {
      const stats = await getPayrollStats(c.req.param("academyId"));
      return c.json(stats);
    });

    app.get("/academies/:academyId/payroll/staff", async (c) => {
      const staff = await getStaffMembers(c.req.param("academyId"));
      return c.json(staff);
    });
  },
});
