# Sign-in portals (players, coaches, staff)

Each role has its own sign-in page. Share the link that matches the person’s role when handing out credentials.

| Role | Sign-in URL (local dev) | After sign-in |
|------|-------------------------|---------------|
| **Athlete (player)** | `/auth/player/login` | `/player/home` |
| **Coach** | `/auth/coach/login` | `/coach/{academyId}/home` |
| **Support staff** | `/auth/staff/login` | Academy dashboard (staff app coming soon) |
| **Academy admin** | `/auth/login` | `/academy/{id}/dashboard` |

Production URLs use the same paths on your deployed domain (e.g. `https://app.khelsetu.in/auth/player/login`).

---

## How links work with deep routes

If someone opens a protected page while logged out, they are sent to the matching sign-in page with a return path:

- `/player/drills` → `/auth/player/login?next=/player/drills`
- `/coach/…/players` → `/auth/coach/login?next=…`

After sign-in (and password change if required), they land on the intended page when their role allows it.

---

## Admin checklist

From **Credential Management**, use **Copy credentials** — it includes the sign-in link, username, and temporary password for that role.

See also: [How to sign in as a player](sign-in-as-a-player.md)
