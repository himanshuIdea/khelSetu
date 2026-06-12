import { getAcademyMeta } from "@/lib/repositories/academy";
import { isSlugAvailable } from "@/lib/repositories/onboarding";
import { isValidAcademyId } from "@/lib/academy-id";
import { validateBrandedLink } from "@/lib/branded-link";
import { loadEnv } from "../../lib/load-env";
import { createService } from "../shared/create-service";
import { servicePorts } from "../shared/config";

loadEnv();

createService({
  name: "academy-service",
  port: servicePorts.academy,
  dbHealth: true,
  routes: (app) => {
    app.get("/academies/:academyId/meta", async (c) => {
      const academyId = c.req.param("academyId");
      if (!isValidAcademyId(academyId)) {
        return c.json({ error: "Invalid academy id" }, 400);
      }
      const meta = await getAcademyMeta(academyId);
      if (!meta) return c.json({ error: "Academy not found" }, 404);
      return c.json(meta);
    });

    app.get("/academies/slug/:slug/available", async (c) => {
      const slug = c.req.param("slug");
      const validation = validateBrandedLink(slug);
      if (!validation.valid) {
        return c.json({
          available: false,
          reason: "invalid_format",
          message: validation.message,
        });
      }
      const available = await isSlugAvailable(slug);
      return c.json({
        available,
        ...(available ? {} : { reason: "taken", message: "This link is already taken." }),
      });
    });

    app.post("/academies/onboarding", async (c) => {
      return c.json(
        { error: "Academy onboarding requires authentication via the web app." },
        401
      );
    });
  },
});
