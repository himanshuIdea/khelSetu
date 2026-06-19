import { eq } from "drizzle-orm";
import { academies, users } from "@/db/schema";
import { adminEmailForSlug } from "@/db/seed/bulk/admin-credentials";
import { buildAllAcademySpecs } from "@/db/seed/bulk/distributions";
import { loadEnv } from "@/lib/load-env";
import { getInitials } from "@/lib/onboarding";
import { db } from "@/lib/db/client";

loadEnv();

async function main() {
  const specs = buildAllAcademySpecs();
  let updated = 0;

  for (const spec of specs) {
    const [row] = await db
      .update(academies)
      .set({
        name: spec.name,
        initials: spec.initials,
        updatedAt: new Date(),
      })
      .where(eq(academies.slug, spec.slug))
      .returning({ id: academies.id });

    if (!row) {
      console.warn(`  missing academy slug: ${spec.slug}`);
      continue;
    }

    const adminEmail = adminEmailForSlug(spec.slug);
    await db
      .update(users)
      .set({
        fullName: `${spec.name} Admin`,
        avatarInitials: getInitials(spec.name),
        updatedAt: new Date(),
      })
      .where(eq(users.email, adminEmail));

    updated += 1;
  }

  console.log(`Refreshed names for ${updated}/${specs.length} academies.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
