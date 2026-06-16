import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { coaches, staff } from "@/db/schema";

export async function syncOrphanCoachesToStaff(academyId: string) {
  const orphans = await db
    .select()
    .from(coaches)
    .where(and(eq(coaches.academyId, academyId), isNull(coaches.staffId)));

  let linked = 0;
  let created = 0;

  for (const coach of orphans) {
    const [existingStaff] = await db
      .select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.academyId, academyId), eq(staff.fullName, coach.fullName)))
      .limit(1);

    let staffId = existingStaff?.id;

    if (!staffId) {
      const [staffRow] = await db
        .insert(staff)
        .values({
          academyId,
          fullName: coach.fullName,
          roleTitle: coach.roleTitle,
          employmentType: "full_time",
          monthlySalaryPaise: 0,
          avatarColor: coach.avatarColor,
        })
        .returning({ id: staff.id });
      staffId = staffRow.id;
      created += 1;
    } else {
      linked += 1;
    }

    await db
      .update(coaches)
      .set({ staffId, updatedAt: new Date() })
      .where(eq(coaches.id, coach.id));
  }

  return { linked, created };
}
