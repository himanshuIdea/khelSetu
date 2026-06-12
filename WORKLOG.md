# Khel Setu — Project Worklog

**Last updated:** June 12, 2026  
**Repository:** `khel-setu/` (Next.js App Router + PostgreSQL + microservices gateway)

---

## At a glance

| Metric | Count |
|--------|------:|
| **Domains tracked** | 15 |
| **Full CRUD (repo + API + UI)** | 1 (Players) |
| **Partial CRUD** | 6 (Auth, Academy onboarding, Coaches, Teams, Batches, Player fees) |
| **Read-only (data wired)** | 6 (Dashboard, Attendance, Gear, Tournaments, Payroll, Drill reviews) |
| **UI / mock only** | 2 (Academy Reports, State portal) |
| **Next.js API routes** | 11 |
| **Repository modules** | 14 |
| **Academy pages** | 10 (+ layout) |
| **State admin pages** | 8 (+ layout) |

**Legend:** ✅ Done · 🟡 Partial · ❌ Not started · 🔲 UI only / mock

---

## 1. Session summary (chronology)

Work completed across recent agent sessions, in approximate order:

1. **State admin RBAC** — `state.department@gmail.com` seeded with `platform_role = state_admin`; `/state/*` gated via JWT middleware; state admins blocked from academy routes.
2. **Auth route split** — User sign-up at `/auth/sign-up`; academy profile onboarding at `/auth/onboarding`; `/academy/onboarding` redirects to `/auth/onboarding`.
3. **JWT + httpOnly cookies** — `jose` JWT in `khelsetu_session` cookie; `POST /api/v1/auth/{register,login,logout}`, `GET /api/v1/auth/me`; bcrypt password hashing; OTP stub (`lib/auth/otp.ts` accepts any non-empty OTP).
4. **Aligned post-auth redirects** — `resolvePostAuthRedirect`: state admin → `/state`; academy member → `/academy/{id}/dashboard`; no academy → `/auth/onboarding`.
5. **Academy onboarding wired** — `createAcademyProfile` links JWT user (no duplicate user row); `ensureAcademyBatches` on create; slug availability check API.
6. **Players page (ship + polish)** — Full CRUD modals (`AddPlayerModal`, `EditPlayerModal`, `RemovePlayerDialog`); `PlayersWorkspace` + `PlayerSidePanelClient` deferred detail fetch; filter pills with portaled menus; responsive table columns.
7. **Player form enhancements** — Height category field + migration `0010_players_height_category`; custom `InlineDatePicker`; batch inference from DOB.
8. **Academy empty states** — Shared `EmptyState` in `components/academy/shared.tsx`; context-specific copy on every academy screen and sub-section.
9. **Performance patterns** — `resolveAcademy` via `React.cache()`; `Promise.all` on RSC pages; `loading.tsx` for `app/academy/[id]/` and `players/`; `listAcademyBatches` on read paths (not `ensureAcademyBatches`).
10. **Agent / workflow docs** — `AGENTS.md`, `.cursor/rules/khelsetu-workflow.mdc`, `.cursor/skills/khelsetu-mockup-ui/SKILL.md` codify mockup fidelity, repo-direct reads, and acceptance checklists.
11. **Coaches & Teams create** — `AddCoachModal`, `AddTeamModal` POST to Next.js API routes; list pages read from repositories.
12. **Teams roster role edit** — Role column editable via `InlineSelect` in edit mode; captain assignment confirms via `ChangeCaptainDialog`; PATCH member accepts `role` and demotes prior captain in one transaction.

---

## 2. Architecture decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Server page data** | `lib/repositories/*` direct on RSC | Avoid gateway round-trip latency on page load |
| **Client mutations** | `api.*` → same-origin Next.js `app/api/v1/*` | Browser uses `credentials: "include"`; routes call repositories with session checks |
| **Gateway role** | Read proxy to microservices (`:4000`) | Used when server-side code calls `api.*` (non-browser); microservices are read-heavy today |
| **Academy context** | `resolveAcademy(id)` = `cache(getAcademyMeta)` | Shared across layout + pages in one request |
| **Players interactivity** | `PlayersWorkspace` → `PlayerSidePanelClient` | List on RSC; detail fetched on selection (keeps TTFB fast) |
| **Player delete** | Soft delete (`status = inactive`) | `removePlayer` clears batch/coach links; row retained |
| **Batches** | Auto-created on academy onboarding via `ensureAcademyBatches` | Sub-junior / Junior / Senior per sport; read UI uses `listAcademyBatches` only |
| **Dropdowns / menus** | `createPortal(..., document.body)` | Prevents overflow clipping (`FilterPillMenu`, `AdminAvatarMenu`) |
| **Auth session** | JWT in httpOnly cookie, not `sessionStorage` | Middleware verifies on `/state`, `/academy`, `/auth/onboarding` |
| **Fees route naming** | `/academy/[id]/fees` = Staff & Payroll UI | Player fee collection lives on Players side panel + dashboard trend |

### Request flow (simplified)

```
Browser RSC page     → lib/repositories/*  → PostgreSQL
Browser client modal → app/api/v1/*        → lib/repositories/* → PostgreSQL
Server api.* call    → gateway :4000       → microservice      → lib/repositories/*
```

---

## 3. CRUD progress by domain

### Auth & identity

| Area | Create | Read | Update | Delete | UI wired | API wired | Notes |
|------|--------|------|--------|--------|----------|-----------|-------|
| **User registration** | ✅ | — | — | — | ✅ | ✅ | `UserSignUpForm` → `POST /api/v1/auth/register` |
| **Login (password)** | — | ✅ | — | — | ✅ | ✅ | `POST /api/v1/auth/login` |
| **Login (OTP)** | — | 🟡 | — | — | ✅ | 🟡 | UI present; `verifyOtp` stub accepts any OTP |
| **Session / me** | — | ✅ | — | — | ✅ | ✅ | `GET /api/v1/auth/me`; onboarding guard uses this |
| **Logout** | — | — | — | ✅ | ✅ | ✅ | `AdminAvatarMenu`, onboarding back → `POST /api/v1/auth/logout` |
| **Password reset** | — | — | — | — | 🔲 | ❌ | "Forgot password" button on login — no handler |
| **Profile update** | — | — | ❌ | — | ❌ | ❌ | No user edit API or UI |

**Repo:** `lib/repositories/auth.ts` — `registerWithPassword`, `registerWithPhone`, `loginWithPassword`, `loginWithPhone`, `getAuthProfile`, `userHasAcademyMembership`  
**Routes:** `app/api/v1/auth/{register,login,logout,me}/route.ts`  
**RBAC:** `middleware.ts` + `lib/rbac.ts` — `state_admin` only on `/state/*`

---

### Academy onboarding

| Area | Create | Read | Update | Delete | UI wired | API wired | Notes |
|------|--------|------|--------|--------|----------|-----------|-------|
| **Academy profile** | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | `OnboardingProfileForm` → `POST /api/v1/academies/onboarding` |
| **Slug availability** | — | ✅ | — | — | ✅ | ✅ | `GET /api/v1/academies/slug/[slug]/available` |
| **Academy meta** | — | ✅ | ❌ | ❌ | ✅ | 🟡 | `resolveAcademy` / `getAcademyMeta`; no settings edit UI |
| **Sports selection** | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | Stored on create; read via `academySports` joins |
| **Default batches** | ✅ | ✅ | ❌ | ❌ | — | — | `ensureAcademyBatches` on create only |

**Repo:** `lib/repositories/onboarding.ts` — `createAcademyProfile`, `isSlugAvailable`  
**Redirect:** `/academy/onboarding` → `/auth/onboarding`

---

### Players

| Area | Create | Read | Update | Delete | UI wired | API wired | Notes |
|------|--------|------|--------|--------|----------|-----------|-------|
| **Player list** | — | ✅ | — | — | ✅ | 🟡 | RSC `getPlayers`; gateway has list proxy but page uses repo |
| **Player detail** | — | ✅ | — | — | ✅ | ✅ | `PlayerSidePanelClient` → `GET .../players/[externalId]` |
| **Player for edit** | — | ✅ | — | — | ✅ | ✅ | `GET .../players/[id]?for=edit` |
| **Add player** | ✅ | — | — | — | ✅ | ✅ | `AddPlayerModal` → `POST .../players` |
| **Edit player** | — | — | ✅ | — | ✅ | ✅ | `EditPlayerModal` → `PATCH .../players/[id]` |
| **Deboard / remove** | — | — | — | ✅ | ✅ | ✅ | `RemovePlayerDialog` → `DELETE` (soft inactive) |
| **Full profile modal** | — | ✅ | — | — | ✅ | ✅ | `PlayerProfileModal` — read-only view |
| **Filters** | — | ✅ | — | — | ✅ | — | Client-side `filterPlayers` in `PlayersListSection` |
| **Record fee payment** | ❌ | — | — | — | 🔲 | ❌ | Button in side panel — no click handler or API |

**Repo:** `lib/repositories/players.ts` — full CRUD + `getPlayerFormOptions` (uses `listAcademyBatches`)  
**Routes:** `app/api/v1/academies/[academyId]/players/route.ts` (POST), `[externalId]/route.ts` (GET, PATCH, DELETE)  
**UI:** `PlayersWorkspace`, `PlayersPageHeader`, `PlayersListSection`, modals above

---

### Coaches

| Area | Create | Read | Update | Delete | UI wired | API wired | Notes |
|------|--------|------|--------|--------|----------|-----------|-------|
| **Coach list** | — | ✅ | — | — | ✅ | 🟡 | RSC `getCoaches` |
| **Add coach** | ✅ | — | — | — | ✅ | ✅ | `AddCoachModal` → `POST .../coaches` |
| **Edit coach** | — | — | ❌ | — | ❌ | ❌ | No modal or route |
| **Remove coach** | — | — | — | ❌ | ❌ | ❌ | — |
| **Pending video reviews** | — | ✅ | ❌ | — | ✅ | 🟡 | `getPendingReviews`; "Open review queue" button inert |
| **Review submission** | — | — | ❌ | — | ❌ | ❌ | `drillSubmissions` table exists; no approve/reject API |

**Repo:** `lib/repositories/coaches.ts` — `getCoaches`, `getPendingReviews`, `getCoachCount`, `getCoachFormOptions`, `createCoach`  
**Routes:** `app/api/v1/academies/[academyId]/coaches/route.ts` (POST only)

---

### Teams

| Area | Create | Read | Update | Delete | UI wired | API wired | Notes |
|------|--------|------|--------|--------|----------|-----------|-------|
| **Featured team** | — | ✅ | — | — | ✅ | 🟡 | `resolveActiveTeam` / `getTeamById`; `?team=` deep link |
| **Team members** | ✅ | ✅ | — | — | ✅ | ✅ | Roster from DB; empty state → `AddTeamMembersModal` |
| **Other teams** | — | ✅ | — | — | ✅ | 🟡 | `getOtherTeams` side panel; click switches active team via URL |
| **Line-up suggestion** | — | ✅ | — | — | 🔲 | 🟡 | Data shown; "Review suggestion" button inert |
| **Create team** | ✅ | — | — | — | ✅ | ✅ | `AddTeamModal` → `POST .../teams` |
| **Edit team** | — | — | 🟡 | — | ✅ roster edit | ✅ roster edit | Hero edit toggle; add/remove members, role + selection in edit mode |
| **Member role** | — | — | ✅ | — | ✅ | ✅ | `InlineSelect` in edit mode; captain change confirms via `ChangeCaptainDialog` |
| **Delete team** | — | — | — | ❌ | ❌ | ❌ | — |
| **Add/remove members** | ✅ | — | — | ✅ remove | ✅ | ✅ | `POST .../members`; `DELETE .../members/[playerId]` |

**Repo:** `lib/repositories/teams.ts` — read helpers + `createTeam`, `addTeamMembers`, `removeTeamMember`, `updateTeamMemberSelection`, `updateTeamMemberRole`, `getTeamFormOptions`, `getTeamMemberFormOptions`  
**Routes:** `app/api/v1/academies/[academyId]/teams/route.ts` (POST), `.../teams/[teamId]/members/route.ts` (POST), `.../members/[playerId]/route.ts` (PATCH selection/role, DELETE remove)

---

### Batches

| Area | Create | Read | Update | Delete | UI wired | API wired | Notes |
|------|--------|------|--------|--------|----------|-----------|-------|
| **Auto-provision** | ✅ | — | — | — | — | — | `ensureAcademyBatches` on academy create |
| **List for forms** | — | ✅ | — | — | ✅ | — | `listAcademyBatches` in player/coach form options |
| **Dedupe** | — | — | 🟡 | 🟡 | — | — | `dedupeAcademyBatches` internal maintenance |
| **Manual CRUD** | ❌ | — | — | — | ❌ | ❌ | No batch management screen |

**Repo:** `lib/repositories/batches.ts` — no public create/update/delete for UI

---

### Player fees & collections

| Area | Create | Read | Update | Delete | UI wired | API wired | Notes |
|------|--------|------|--------|--------|----------|-----------|-------|
| **Fee on player create** | 🟡 | — | — | — | ✅ | ✅ | Auto `feeInvoices` row when `monthlyFeePaise` set |
| **Fee on player edit** | — | — | 🟡 | — | ✅ | ✅ | Upserts current-period invoice |
| **Record payment** | ❌ | — | — | — | 🔲 | ❌ | Side panel button — stub |
| **Fee status display** | — | ✅ | — | — | ✅ | — | List + side panel from `feeInvoices` join |
| **Collection trend** | — | ✅ | — | — | ✅ | — | Dashboard `getFeeCollectionTrend` from `feePayments` |

**Schema:** `operations.fee_invoices`, `operations.fee_payments` — no dedicated repository or API yet

---

### Staff & payroll (`/fees` route)

| Area | Create | Read | Update | Delete | UI wired | API wired | Notes |
|------|--------|------|--------|--------|----------|-----------|-------|
| **Payroll stats** | — | ✅ | — | — | ✅ | 🟡 | `getPayrollStats` |
| **Staff list** | — | ✅ | — | — | ✅ | 🟡 | `getStaffMembers` + payslip status |
| **Run payroll** | ❌ | — | — | — | 🔲 | ❌ | Header action button inert |
| **Payslip approve** | — | — | ❌ | — | 🔲 | ❌ | Table shows status; row action pill inert |

**Repo:** `lib/repositories/payroll.ts` — read only  
**Page:** `app/academy/[id]/fees/page.tsx` (labeled Staff & Payroll)

---

### Attendance

| Area | Create | Read | Update | Delete | UI wired | API wired | Notes |
|------|--------|------|--------|--------|----------|-----------|-------|
| **Sessions list** | — | ✅ | — | — | ✅ | 🟡 | `getAttendanceSessions` |
| **Mark attendance** | ❌ | — | ❌ | — | 🔲 | ❌ | Header button + filter pills inert |
| **Attendance records** | ❌ | — | ❌ | ❌ | ❌ | ❌ | `attendanceRecords` table; no write repo |

**Repo:** `lib/repositories/attendance.ts` — `getAttendanceSessions` only  
**Page:** `app/academy/[id]/attendance/page.tsx`

---

### Gear & inventory

| Area | Create | Read | Update | Delete | UI wired | API wired | Notes |
|------|--------|------|--------|--------|----------|-----------|-------|
| **Inventory stats** | — | ✅ | — | — | ✅ | 🟡 | `getInventoryStats` |
| **Items list** | — | ✅ | — | — | ✅ | 🟡 | `getInventoryItems` |
| **Movements feed** | — | ✅ | — | — | ✅ | 🟡 | `getGearMovements` |
| **Add item** | ❌ | — | — | — | 🔲 | ❌ | Header button inert |
| **Issue gear** | ❌ | — | — | — | 🔲 | ❌ | Side panel selects + "Issue now" — static UI |

**Repo:** `lib/repositories/inventory.ts` — read only

---

### Tournaments

| Area | Create | Read | Update | Delete | UI wired | API wired | Notes |
|------|--------|------|--------|--------|----------|-----------|-------|
| **Active tournament** | — | ✅ | — | — | ✅ | 🟡 | `getActiveTournament` |
| **Bracket** | — | ✅ | — | — | ✅ | 🟡 | `getBracketMatches` |
| **Mat schedule** | — | ✅ | — | — | ✅ | 🟡 | `getMatSchedule` |
| **Medal tally** | — | ✅ | — | — | ✅ | 🟡 | `getTournamentMedals` |
| **Create tournament** | ❌ | — | — | — | 🔲 | ❌ | Header button inert |
| **Score / advance match** | — | — | ❌ | — | ❌ | ❌ | Bracket display only |

**Repo:** `lib/repositories/tournaments.ts` — read only

---

### Dashboard

| Area | Create | Read | Update | Delete | UI wired | API wired | Notes |
|------|--------|------|--------|--------|----------|-----------|-------|
| **Stat cards** | — | ✅ | — | — | ✅ | — | `getDashboardStats` via `getDashboardData` |
| **Fee trend chart** | — | ✅ | — | — | ✅ | — | SVG from `buildFeeTrendChart` |
| **Players by sport** | — | ✅ | — | — | ✅ | — | Donut from `getPlayersBySport` |
| **Today's sessions** | — | ✅ | — | — | ✅ | — | `getTodaySessions` |
| **Recent activity** | — | ✅ | — | — | ✅ | — | `getRecentActivity` |
| **Quick add** | ❌ | — | — | — | 🔲 | ❌ | Header action inert |

**Repo:** `lib/repositories/dashboard.ts` — read only  
**Page:** `app/academy/[id]/dashboard/page.tsx`

---

### Academy reports

| Area | Create | Read | Update | Delete | UI wired | API wired | Notes |
|------|--------|------|--------|--------|----------|-----------|-------|
| **Report catalog** | — | 🔲 | — | — | 🔲 | ❌ | Static cards + hardcoded stat grid |
| **Generate report** | ❌ | — | — | — | 🔲 | ❌ | Buttons inert; no export API |

**Page:** `app/academy/[id]/reports/page.tsx` — presentation only

---

### State admin portal (`/state`)

| Area | Create | Read | Update | Delete | UI wired | API wired | Notes |
|------|--------|------|--------|--------|----------|-----------|-------|
| **Overview** | — | 🔲 | — | — | 🔲 | ❌ | `lib/state-mock-data` |
| **Districts** | — | 🔲 | — | — | 🔲 | ❌ | Mock |
| **Nurseries** | — | 🔲 | — | — | 🔲 | ❌ | Mock |
| **Athletes** | — | 🔲 | — | — | 🔲 | ❌ | Mock |
| **Verification** | — | 🔲 | — | — | 🔲 | ❌ | Mock |
| **Funds** | — | 🔲 | — | — | 🔲 | ❌ | Mock |
| **Scouting** | — | 🔲 | — | — | 🔲 | ❌ | Mock |
| **Reports** | — | 🔲 | — | — | 🔲 | ❌ | Mock |

**Auth:** JWT middleware requires `state_admin`  
**Data:** No `lib/repositories/state*` — all pages import `lib/state-mock-data`

---

## 4. API routes inventory (`app/api/v1/`)

| Method | Path | Handler | Backing repo |
|--------|------|---------|--------------|
| POST | `/auth/register` | Create user + JWT cookie | `auth.registerWith*` |
| POST | `/auth/login` | Verify + JWT cookie | `auth.loginWith*` |
| GET | `/auth/me` | Session profile + academies | `auth.getAuthProfile` |
| POST | `/auth/logout` | Clear cookie | — |
| POST | `/academies/onboarding` | Create academy + membership | `onboarding.createAcademyProfile` |
| GET | `/academies/slug/[slug]/available` | Slug check | `onboarding.isSlugAvailable` |
| POST | `/academies/[id]/players` | Create player | `players.createPlayer` |
| GET | `/academies/[id]/players/[externalId]` | Detail or edit payload | `players.getPlayerDetail` / `getPlayerForEdit` |
| PATCH | `/academies/[id]/players/[externalId]` | Update player | `players.updatePlayer` |
| DELETE | `/academies/[id]/players/[externalId]` | Soft-remove player | `players.removePlayer` |
| POST | `/academies/[id]/coaches` | Create coach | `coaches.createCoach` |
| POST | `/academies/[id]/teams` | Create team | `teams.createTeam` |
| POST | `/academies/[id]/teams/[teamId]/members` | Add team members | `teams.addTeamMembers` |
| PATCH | `/academies/[id]/teams/[teamId]/members/[playerId]` | Update member selection and/or role | `teams.updateTeamMemberSelection`, `teams.updateTeamMemberRole` |
| DELETE | `/academies/[id]/teams/[teamId]/members/[playerId]` | Remove team member | `teams.removeTeamMember` |

**Not in Next.js API (gateway/microservice read proxies only):** dashboard, attendance, inventory, payroll, tournaments, player list GET, coach list GET, team reads.

---

## 5. Repository inventory (`lib/repositories/`)

| Module | Exports | CRUD |
|--------|---------|------|
| `auth.ts` | register, login, profile, membership check | C + R |
| `onboarding.ts` | `createAcademyProfile`, `isSlugAvailable` | C + R |
| `academy.ts` | `getAcademyById`, `getAcademyBySlug`, `getAcademyMeta` | R |
| `resolve-academy.ts` | `resolveAcademy` (cached) | R |
| `players.ts` | list, detail, counts, form options, create, update, remove | **CRUD** |
| `coaches.ts` | list, pending reviews, count, form options, create | C + R |
| `teams.ts` | featured, members, others, lineup, form options, create, add/remove members, update selection/role | C + R + U + D (members) |
| `batches.ts` | ensure, dedupe, list, get (ensure) | C (internal) + R |
| `dashboard.ts` | stats, fee trend, players by sport, sessions, activity | R |
| `attendance.ts` | `getAttendanceSessions` | R |
| `inventory.ts` | stats, items, movements | R |
| `payroll.ts` | stats, staff | R |
| `tournaments.ts` | active, bracket, mat schedule, medals | R |

---

## 6. Academy pages (`app/academy/[id]/`)

| Route | Data source | Empty states | `loading.tsx` | Mutations in UI |
|-------|-------------|--------------|---------------|-----------------|
| `dashboard` | `resolveAcademy`, `getDashboardData` | ✅ per widget | Parent only | 🔲 Quick add |
| `players` | `getPlayers`, `getPlayerFormOptions` | ✅ list + panel | ✅ | ✅ Add/Edit/Remove |
| `coaches` | `getCoaches`, `getPendingReviews`, … | ✅ list + reviews | Parent only | ✅ Add coach |
| `teams` | `getFeaturedTeam`, `getTeamMembers`, … | ✅ team + members + others | Parent only | ✅ Add team + add members |
| `tournaments` | `getActiveTournament`, bracket, … | ✅ tournament + bracket + mats | Parent only | 🔲 Create |
| `attendance` | `getAttendanceSessions` | ✅ sessions | Parent only | 🔲 Mark |
| `gear` | inventory repos | ✅ items + movements | Parent only | 🔲 Add / Issue |
| `fees` | payroll repos | ✅ staff table | Parent only | 🔲 Run payroll |
| `reports` | `resolveAcademy` + static | ❌ (static stats) | Parent only | 🔲 Generate |

**Layout:** `resolveAcademy` in `[id]/layout.tsx` → `AcademyLayoutClient` shell + sidebar nav.

---

## 7. Components with create/edit/remove UI (`components/academy/`)

| Component | Operation | Wired to API |
|-----------|-----------|--------------|
| `AddPlayerModal` | Create | ✅ `api.players.create` |
| `EditPlayerModal` | Update | ✅ `api.players.update` + `getForEdit` |
| `RemovePlayerDialog` | Delete (soft) | ✅ `api.players.remove` |
| `PlayerProfileModal` | Read | ✅ via cached detail |
| `PlayerSidePanel` | — | 🔲 Record fee payment stub |
| `AddCoachModal` | Create | ✅ `api.coaches.create` |
| `AddTeamModal` | Create | ✅ `api.teams.create` |
| `AddTeamMembersModal` | Add members | ✅ `api.teams.addMembers` |
| `ChangeCaptainDialog` | Captain role change | ✅ `api.teams.updateMember` (`role: captain`) |
| `TeamsWorkspace` | Roster edit | ✅ add/remove, selection + role via `InlineSelect` |
| `AdminAvatarMenu` | Logout | ✅ `api.auth.logout` |
| `PendingReviewsPanel` | — | 🔲 Review queue button |
| `FilterPillMenu` | Filter | ✅ client-only |

---

## 8. Microservices & gateway (`services/`)

| Service | Port | Write routes | Read routes |
|---------|------|--------------|-------------|
| **gateway** | 4000 | Proxies all | Health + proxy |
| **academy** | 4001 | `POST /academies/onboarding` | meta, slug check |
| **people** | 4002 | ❌ none | players, coaches (+ counts, reviews) |
| **operations** | 4003 | ❌ none | dashboard, attendance |
| **competitions** | 4004 | ❌ none | teams, tournaments |
| **inventory** | 4005 | ❌ none | inventory stats/items/movements |
| **payroll** | 4006 | ❌ none | payroll stats/staff |

**Note:** All **mutations** for players/coaches/teams run through **Next.js `app/api`** today, not microservices. Gateway POSTs to people/competitions would 404 on the service side.

---

## 9. Known gaps & tech debt

| Item | Severity | Detail |
|------|----------|--------|
| **Drizzle migration journal drift** | High | `_journal.json` lists migrations `0000`–`0010`; DB `__drizzle_migrations` may only record first 3 — `pnpm db:migrate` can fail re-applying `0003+`. `0010_players_height_category` applied manually in dev. Missing snapshots for `0004`–`0008`, `0010`. |
| **Record fee payment** | Medium | UI button in `PlayerSidePanel`; no `feePayments` write repo or API |
| **Gateway vs Next.js mutation split** | Medium | Creates hit Next.js; reads can hit gateway — document for new endpoints; consider adding POST to people-service or dropping gateway for mutations |
| **`services/README.md` stale** | Low | Says "Next.js never talks to DB directly" — RSC pages now use repositories directly |
| **OTP auth** | Medium | Stub only (`lib/auth/otp.ts`); `phone_verified` never set true |
| **Password reset** | Medium | Login UI link with no flow |
| **Academy `loading.tsx` coverage** | Low | Only `[id]/loading.tsx` and `[id]/players/loading.tsx` — other child routes inherit parent skeleton |
| **State portal** | Expected | Entire `/state` tree uses mock data — no backend |
| **Reports (academy)** | Expected | Static template cards |
| **Inert action buttons** | Low | Quick add, Mark attendance, Run payroll, Create tournament, Generate report, Issue gear, Review lineup, Open review queue |
| **Team metadata edit** | Low | No PATCH team name/coach/weight class |
| **Coach edit/delete** | Medium | No APIs |
| **Middleware scope** | Low | `/auth/login` and `/auth/sign-up` not in matcher — public by design; academy membership not verified per-route in middleware (relies on API 403) |

---

## 10. Next recommended work

Priority order based on incomplete CRUD and user-facing stubs:

1. **Fix migration journal sync** — Reconcile `drizzle.__drizzle_migrations` with `db/migrations/meta/_journal.json`; generate missing snapshots so `pnpm db:migrate` is reliable on fresh clones.
2. **Record fee payment** — Repository + `POST .../players/[id]/payments` + wire side panel button; updates `feeInvoices` / `feePayments` and refreshes list.
3. **Mark attendance** — `createAttendanceRecords` repo + modal from attendance page; updates `attendanceRecords` for a session.
4. **Coach update + drill review** — PATCH coach; POST review decision on `drillSubmissions`; wire `PendingReviewsPanel`.
5. **Team metadata edit** — PATCH team name, coach, weight class.
6. **Extend `loading.tsx`** — Per-route skeletons for coaches, teams, dashboard (per `AGENTS.md` checklist).
7. **Gateway alignment** — Add mutation handlers to people/competitions services **or** stop proxying writes and document Next.js as sole mutation layer.
8. **Payroll actions** — Run payroll + approve payslip flows against `payrollRuns` / `payslips` schema.
9. **Inventory writes** — Add item + issue/return gear against existing schema.
10. **State portal backend** — Replace `state-mock-data` with read repos when state-level schema is defined.

---

## 11. Dev credentials (seeded)

| Role | Email | Password | Landing |
|------|-------|----------|---------|
| State admin | `state.department@gmail.com` | `khel@setu1234` | `/state` |
| Academy admin | `rajesh@dronacharya.in` (seed) | (see `db/seed`) | `/academy/{id}/dashboard` |

---

*This file is the single source of truth for project progress. Update it when shipping new CRUD surfaces or closing tech-debt items.*
