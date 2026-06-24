import { sql } from "drizzle-orm";

/** Unique listed nursery academies — registrations plus approved onboarding not yet registered. */
export const listedNurseriesCte = sql`
  listed_nurseries AS (
    SELECT academy_id
    FROM (
      SELECT r.academy_id
      FROM platform.state_nursery_registrations r
      UNION
      SELECT o.academy_id
      FROM platform.academy_onboarding_requests o
      WHERE o.status = 'approved'
        AND o.academy_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM platform.state_nursery_registrations r2
          WHERE r2.academy_id = o.academy_id
        )
    ) unique_listed
  )
`;

export const activeNurseryPlayersCte = sql`
  scoped_players AS (
    SELECT
      p.full_name,
      p.rating,
      p.avatar_color,
      p.weight_category,
      s.name AS sport_name,
      a.district,
      b.name AS batch_name
    FROM people.players p
    INNER JOIN listed_nurseries ln ON ln.academy_id = p.academy_id
    INNER JOIN academy.academies a ON a.id = p.academy_id AND a.deleted_at IS NULL
    INNER JOIN academy.sports s ON s.id = p.sport_id
    LEFT JOIN academy.batches b ON b.id = p.batch_id
    WHERE p.status IN ('active', 'on_hold')
  )
`;
