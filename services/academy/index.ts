import { getAcademyMeta } from "@/lib/repositories/academy";
import {
  createAcademyProfile,
  isSlugAvailable,
} from "@/lib/repositories/onboarding";
import { isValidAcademyId } from "@/lib/academy-id";
import { validateBrandedLink } from "@/lib/branded-link";
import { validateOnboardingPayload, type OnboardingPayload } from "@/lib/onboarding";
import { loadEnv } from "../../lib/load-env";
import { createService } from "../shared/create-service";
import { servicePorts } from "../shared/config";

loadEnv();

createService({
  name: "academy-service",
  port: servicePorts.academy,
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
      const body = (await c.req.json()) as OnboardingPayload;
      const validationError = validateOnboardingPayload(body);
      if (validationError) {
        return c.json({ error: validationError }, 400);
      }

      try {
        const result = await createAcademyProfile(body);
        return c.json(result, 201);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not create academy";
        const status = message.includes("already taken") ? 409 : 500;
        return c.json({ error: message }, status);
      }
    });
  },
});
