# How to sign in as a player (athlete)

Your academy admin creates your login from **Dashboard → Credential Management → Athletes**. They will give you:

- **Sign-in link:** `http://localhost:3000/auth/player/login`
- **Username** (e.g. `rohitsangwan`)
- **Temporary password** (8 digits, shown once)

Save all three before closing the admin’s screen.

---

## First time — step by step

1. Open the **sign-in link** your admin shared (or go to **http://localhost:3000/auth/player/login**).
2. Enter your **username** and the **temporary password**.
3. Tap **Continue**.
4. You’ll be asked to **set a new password** (at least 8 characters). Use the temporary password in the “current password” field.
5. After saving, you’re taken to **your athlete home**: `/player/home`.

That’s your app — feed, drills, profile, and the bottom tab bar.

---

## Coming back later

1. Go to **http://localhost:3000/auth/player/login** (or bookmark `/player/home` — you’ll be sent to the athlete sign-in page if needed).
2. Sign in with your **username** and the **password you chose** (not the old 8-digit temp one).

---

## Where you can go (player app)

| Screen | URL |
|--------|-----|
| Home | `/player/home` |
| Explore | `/player/explore` |
| Profile & progress | `/player/profile` |
| Drills | `/player/drills` |
| Submit video | `/player/submit` |

You don’t need to type these — use the tab bar after you’re signed in.

---

## Real situations

**Admin reset my password**  
They issued a new temporary password. Sign in at `/auth/player/login` with that new 8-digit code, then set a fresh password again (same as first login).

**I forgot my password**  
Ask your academy admin to **reissue** a temporary password from Credential Management. They cannot see your chosen password.

**I opened the app and it asks me to sign in**  
Sessions expire or you’re on a new device. Use `/auth/player/login` with username + your password.

**I’m a coach or admin, not a player**  
You won’t stay on `/player/*` — the app sends you to the coach or academy dashboard. Use the correct sign-in link for your role (see [Sign-in portals](sign-in-portals.md)).

**Sign-in fails (“Invalid credentials”)**  
Check username spelling (no spaces), caps lock, and that you’re using the latest temp password if admin just reissued one.

**I sign in but never reach the player app**  
Your admin must **provision credentials** for you in the Athletes grid (username linked to your roster profile). If that step was skipped, ask them to generate credentials.

---

## Quick checklist for admins sharing access

When handing credentials to an athlete, include:

1. Sign-in link: `http://localhost:3000/auth/player/login`
2. Username
3. Temporary password
4. Note: “You’ll pick a new password on first sign-in.”

(Credential Management **Copy credentials** includes the sign-in link automatically.)

---

## For developers

Guards: `lib/auth/require-player-access.ts` · Routes: `lib/player-nav.ts` · Portal login: `lib/auth/portal-login.ts`
