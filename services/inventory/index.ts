import {
  getGearMovements,
  getInventoryItems,
  getInventoryStats,
} from "@/lib/repositories/inventory";
import { loadEnv } from "../../lib/load-env";
import { createService } from "../shared/create-service";
import { servicePorts } from "../shared/config";

loadEnv();

createService({
  name: "inventory-service",
  port: servicePorts.inventory,
  routes: (app) => {
    app.get("/academies/:academyId/inventory/stats", async (c) => {
      const stats = await getInventoryStats(c.req.param("academyId"));
      return c.json(stats);
    });

    app.get("/academies/:academyId/inventory/items", async (c) => {
      const items = await getInventoryItems(c.req.param("academyId"));
      return c.json(items);
    });

    app.get("/academies/:academyId/inventory/movements", async (c) => {
      const movements = await getGearMovements(c.req.param("academyId"));
      return c.json(movements);
    });
  },
});
