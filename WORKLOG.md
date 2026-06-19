# Khel Setu — Project Worklog

**Last updated:** June 15, 2026  
**Repository:** `khel-setu/` (Next.js App Router + PostgreSQL + microservices gateway)

---

## At a glance

| Metric | Count |
|--------|------:|
| **Domains tracked** | 15 |
| **Full CRUD (repo + API + UI)** | 1 (Players) |
| **Partial CRUD** | 6 (Auth, Academy onboarding, Coaches, Teams, Batches, Player fees) |
| **Read-only (data wired)** | 5 (Dashboard, Tournaments, Drill reviews) |
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
9. **Performance patterns** — `resolveAcademy` via `React.cache()`; `unstable_cache` on `getAcademyMeta` (60s); academy layout streams via `Suspense` + `AcademyShellSkeleton`; `Promise.all` on RSC pages; per-route `loading.tsx` for all academy child routes; dashboard sections stream with `Suspense`; postgres client cached on `globalThis` in production; `listAcademyBatches` on read paths (not `ensureAcademyBatches`); removed `syncOrphanCoachesToStaff` from coaches/fees page loads.
10. **Agent / workflow docs** — `AGENTS.md`, `.cursor/rules/khelsetu-workflow.mdc`, `.cursor/skills/khelsetu-mockup-ui/SKILL.md` codify mockup fidelity, repo-direct reads, and acceptance checklists.
11. **Coaches & Teams create** — Coach onboarding via Manage Staff + `AssignCoachModal`; `AddTeamModal` POST to Next.js API routes.
12. **Teams roster role edit** — Role column editable via `InlineSelect` in edit mode; captain assignment confirms via `ChangeCaptainDialog`; PATCH member accepts `role` and demotes prior captain in one transaction.
13. **Attendance marking (full)** — `AttendanceWorkspace` with sport/batch/date filters; present/absent per player; `saveAttendanceRecords` upsert + batch history; Next.js API routes for mark/history.
14. **Coach portal (M3 v1)** — `/coach/[id]/*` hybrid shell (academy sidebar `lg+`, mobile tab bar `<lg`); home assignments, scoped players (read-only detail), attendance for assigned batches, teams create/manage synced to `competitions.teams`; coach-only login redirect; API guards on attendance/teams for `membership_role = coach`.

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
| **Fees route naming** | `/academy/[id]/fees` = Fees & Payroll workspace | Two tabs: Staff & Payroll + Player fees (full billing) |

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
| **Coach list** | — | ✅ | — | — | ✅ | 🟡 | RSC `getCoaches`; cards open `CoachAssignmentsModal` |
| **Onboard coach** | ✅ | — | — | — | ✅ | ✅ | Fees → Manage staff (Coach type); `syncOrphanCoachesToStaff` backfills legacy rows |
| **Assign sport/batches** | ✅ | — | ✅ | ✅ | ✅ | ✅ | Header `AssignCoachModal` + per-coach modal add/edit |
| **Unassign / edit assignments** | — | ✅ | ✅ | ✅ | ✅ | ✅ | `CoachAssignmentsModal` with preview confirm + `DELETE/PATCH .../coaches/[coachId]/assignments` |
| **Edit coach** | — | — | ❌ | — | ❌ | ❌ | No modal or route |
| **Remove coach** | — | — | — | ❌ | ❌ | ❌ | — |
| **Pending video reviews** | — | ✅ | ❌ | — | ✅ | 🟡 | `getPendingReviews`; "Open review queue" button inert |
| **Review submission** | — | — | ❌ | — | ❌ | ❌ | `drillSubmissions` table exists; no approve/reject API |

**Repo:** `lib/repositories/coaches.ts` — `getCoaches`, `assignCoachToBatches`, `listCoachAssignments`, `previewUnassignPlayers`, `unassignCoach`, `updateCoachSportAssignment`, `getAssignCoachFormOptions`; `lib/repositories/coach-staff-sync.ts` — `syncOrphanCoachesToStaff`  
**Routes:** `POST .../coaches/assign`; `GET/PATCH/DELETE .../coaches/[coachId]/assignments`; `GET .../coaches/[coachId]/unassign-preview`; `POST .../coaches` returns 410 (onboarding moved to payroll)

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
| **Record payment** | ✅ | — | ✅ | — | ✅ | ✅ | `RecordFeePaymentModal` on `/fees` Player fees tab; Players side panel stub remains |
| **Fee status display** | — | ✅ | — | — | ✅ | — | List + side panel from `feeInvoices` join |
| **Collection trend** | — | ✅ | — | — | ✅ | — | Dashboard `getFeeCollectionTrend` from `feePayments` |

**Schema:** `operations.fee_invoices`, `operations.fee_payments` — billing repo on `/fees` tab; player side panel partial

---

### Staff & Payroll (`/fees` route)

| Area | Create | Read | Update | Delete | UI wired | API wired | Notes |
|------|--------|------|--------|--------|----------|-----------|-------|
| **Payroll stats** | — | ✅ | — | — | ✅ | — | `getPayrollStats` (RSC) |
| **Staff list** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `FeesWorkspace` / `PayrollStaffSection` |
| **Staff CRUD** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `ManageStaffModal`, `DeleteStaffDialog`; coach stub sync |
| **Run payroll** | ✅ | — | — | — | ✅ | ✅ | `runPayroll` — days from `staff_attendance` |
| **Payslip approve** | — | — | ✅ | — | ✅ | ✅ | Single, selected, bulk via `ApprovePayslipDialog` |

**Repo:** `lib/repositories/payroll.ts` — staff CRUD, `runPayroll`, `approvePayslip`, `bulkApprovePayslips`  
**API:** `POST/PATCH/DELETE .../payroll/staff`, `POST .../payroll/run`, `PATCH .../payroll/payslips/[id]`, `POST .../payroll/payslips/bulk-approve`  
**UI:** `FeesWorkspace`, `PayrollStaffSection`, modals; `fees/loading.tsx`

---

### Player fees (billing)

| Area | Create | Read | Update | Delete | UI wired | API wired | Notes |
|------|--------|------|--------|--------|----------|-----------|-------|
| **Fee stats** | — | ✅ | — | — | ✅ | — | `getFeeBillingStats` (RSC) |
| **Invoice list** | — | ✅ | — | — | ✅ | ✅ | Filters: sport, batch, status |
| **Generate invoices** | ✅ | — | — | — | ✅ | ✅ | Current month for active players |
| **Record payment** | ✅ | — | ✅ | — | ✅ | ✅ | `RecordFeePaymentModal`; single + bulk |

**Repo:** `lib/repositories/fees.ts` — `listPlayerFeeBilling`, `recordFeePayment`, `generateInvoicesForPeriod`  
**API:** `GET .../fees/billing`, `POST .../fees/payments`, `POST .../fees/invoices/generate`  
**UI:** `PlayerFeesSection` tab in `FeesWorkspace`

---

### Attendance

| Area | Create | Read | Update | Delete | UI wired | API wired | Notes |
|------|--------|------|--------|--------|----------|-----------|-------|
| **Sessions list** | — | ✅ | — | — | ✅ | 🟡 | `getAttendanceSessions` (gateway read proxy) |
| **Mark attendance** | ✅ | ✅ | ✅ | — | ✅ | ✅ | `AttendanceWorkspace` — sport/batch/date filters, present/absent per player, save |
| **Staff attendance** | ✅ | ✅ | ✅ | — | ✅ | ✅ | Athletes \| Staff tabs; `StaffAttendanceSection` |
| **Batch history** | — | ✅ | — | — | ✅ | ✅ | `listBatchAttendanceHistory` — per-batch session log |
| **Attendance records** | ✅ | ✅ | ✅ | — | ✅ | ✅ | `saveAttendanceRecords` upserts `attendance_records` + marks `training_sessions` |

**Repo:** `lib/repositories/attendance.ts`, `lib/repositories/staff-attendance.ts`  
**API:** `GET/POST .../attendance/mark`, `GET/POST .../attendance/staff`, `GET .../attendance/batches/[batchId]/history`  
**UI:** `AttendanceWorkspace`, `StaffAttendanceSection`, `attendance/loading.tsx`

---

### Gear & inventory

| Area | Create | Read | Update | Delete | UI wired | API wired | Notes |
|------|--------|------|--------|--------|----------|-----------|-------|
| **Inventory stats** | — | ✅ | — | — | ✅ | 🟡 | `getInventoryStats` (gateway read) |
| **Items list** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `GearWorkspace` table + cards; edit/delete row actions |
| **Add item** | ✅ | — | — | — | ✅ | ✅ | `AddItemModal` + `POST .../inventory/items` |
| **Issue gear** | ✅ | ✅ | — | — | ✅ | ✅ | Side panel issue form; `POST .../inventory/issue` |
| **Return gear** | ✅ | — | — | — | ✅ | ✅ | `ReturnGearModal`; partial returns; `POST .../inventory/return` |
| **Open issues** | — | ✅ | — | — | ✅ | ✅ | `listOpenGearIssues`; `GET .../inventory/issues` |
| **Movements feed** | — | ✅ | — | — | ✅ | 🟡 | `getGearMovements` (gateway read) |

**Repo:** `lib/repositories/inventory.ts` — full CRUD + issue/return + open issues  
**Client:** `GearWorkspace.tsx`, `AddItemModal`, `EditItemModal`, `ReturnGearModal`, `DeleteItemDialog`

---

### Tournaments

| Area | Create | Read | Update | Delete | UI wired | API wired | Notes |
|------|--------|------|--------|--------|----------|-----------|-------|
| **Active tournament** | — | ✅ | — | — | ✅ | 🟡 | `getActiveTournament` |
| **Bracket** | — | ✅ | — | — | ✅ | 🟡 | `getBracketMatches` |
| **Mat schedule** | — | ✅ | — | — | ✅ | 🟡 | `getMatSchedule` |
| **Medal tally** | — | ✅ | — | — | ✅ | 🟡 | `getTournamentMedals` |
| **Create tournament** | 🟡 | — | — | — | ✅ | — | Demo MVP — client state modal, read-only view |
| **Score / advance match** | — | — | ❌ | — | ❌ | ❌ | Bracket display only |

**Repo:** `lib/repositories/tournaments.ts` — read only

---

### Dashboard

| Area | Create | Read | Update | Delete | UI wired | API wired | Notes |
|------|--------|------|--------|--------|----------|-----------|-------|
| **Stat cards** | — | ✅ | — | — | ✅ | — | `getDashboardStats` via `getDashboardData` |
| **Fee trend chart** | — | ✅ | — | — | ✅ | — | `FeeTrendChart` — 3/6/12 month filter via `?months=`; hover tooltips |
| **Players by sport** | — | ✅ | — | — | ✅ | — | `PlayersBySportChart` donut with segment tooltips |
| **Today's sessions** | — | ✅ | — | — | ✅ | — | `getTodaySessions` expands weekly template; card opens timetable modal |
| **Weekly timetable** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Academy hours + per-day slots (sport, multi-batch, coach); template-only recurrence |
| **Recent activity** | — | ✅ | ✅ | — | ✅ | — | Live `activity_events` from player enroll, fee payment, attendance mark |

**Repo:** `lib/repositories/dashboard.ts` (read), `lib/repositories/timetable.ts` (CRUD), `lib/repositories/activity.ts` (write events)  
**API:** `GET/PUT .../timetable`, `POST/PATCH/DELETE .../timetable/slots`  
**UI:** `DashboardWorkspace`, `SessionTimetableModal`, `SessionSlotForm`, `dashboard/FeeTrendChart`, `dashboard/PlayersBySportChart`  
**Schema:** `0011_weekly_timetable` — `academy_schedule_settings`, `weekly_schedule_slots`, `weekly_schedule_slot_batches`  
**Page:** `app/academy/[id]/dashboard/page.tsx` + `loading.tsx`

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
| **Overview** | — | ✅ | — | — | ✅ | ✅ | `state-aggregates.ts` |
| **Districts** | — | ✅ | — | — | ✅ | ✅ | `state-districts.ts` |
| **Nurseries** | ✅ register | ✅ | — | ✅ deregister | ✅ | ✅ | `state_nursery_registrations` + search/register flow |
| **Athletes** | — | ✅ | — | — | ✅ | ✅ | `state-athletes.ts` |
| **Verification** | — | ✅ | — | — | ✅ | ✅ | `listStateNurseries` + aggregates |
| **Funds** | — | ✅ | — | — | ✅ | ✅ | `state-funds.ts` |
| **Scouting** | — | ✅ | — | — | ✅ | ✅ | `state-scouting.ts` |
| **Reports** | — | ✅ | — | — | ✅ | ✅ | `state-reports.ts` |

**Auth:** JWT middleware requires `state_admin`  
**Data:** All state routes use direct repository imports (`state-nurseries`, `state-aggregates`, `state-districts`, `state-athletes`, `state-scouting`, `state-funds`, `state-reports`). Mock data removed.

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
| POST | `/academies/[id]/coaches/assign` | Assign coach to sport + batches | `coaches.assignCoachToBatches` |
| POST | `/academies/[id]/coaches` | Deprecated (410) | Onboarding → Manage staff |
| POST | `/academies/[id]/teams` | Create team | `teams.createTeam` |
| POST | `/academies/[id]/teams/[teamId]/members` | Add team members | `teams.addTeamMembers` |
| PATCH | `/academies/[id]/teams/[teamId]/members/[playerId]` | Update member selection and/or role | `teams.updateTeamMemberSelection`, `teams.updateTeamMemberRole` |
| DELETE | `/academies/[id]/teams/[teamId]/members/[playerId]` | Remove team member | `teams.removeTeamMember` |
| POST | `/academies/[id]/inventory/items` | Create inventory item | `inventory.createInventoryItem` |
| PATCH | `/academies/[id]/inventory/items/[itemId]` | Update inventory item | `inventory.updateInventoryItem` |
| DELETE | `/academies/[id]/inventory/items/[itemId]` | Delete inventory item | `inventory.deleteInventoryItem` |
| GET | `/academies/[id]/inventory/issues` | List open gear issues | `inventory.listOpenGearIssues` |
| POST | `/academies/[id]/inventory/issue` | Issue gear to player | `inventory.issueGear` |
| POST | `/academies/[id]/inventory/return` | Return gear (partial/full) | `inventory.returnGear` |

**Not in Next.js API (gateway/microservice read proxies only):** dashboard, attendance mark (reads via gateway for some), inventory stats/items/movements reads, payroll, tournaments, player list GET, coach list GET, team reads.

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
| `activity.ts` | `recordActivityEvent` for dashboard feed | C |
| `attendance` | `getAttendanceFormOptions`, `getBatchRoster`, `getAttendanceForBatchDate`, `saveAttendanceRecords`, `listBatchAttendanceHistory`, `getAttendanceSessions` | C + R + U |
| `inventory.ts` | stats, items, movements, CRUD, issue, return, open issues | C + R + U + D |
| `payroll.ts` | stats, staff | R |
| `tournaments.ts` | active, bracket, mat schedule, medals | R |

---

## 6. Academy pages (`app/academy/[id]/`)

| Route | Data source | Empty states | `loading.tsx` | Mutations in UI |
|-------|-------------|--------------|---------------|-----------------|
| `dashboard` | `resolveAcademy`, `getDashboardData` | ✅ per widget | ✅ | — (analytics only) |
| `players` | `getPlayers`, `getPlayerFormOptions` | ✅ list + panel | ✅ | ✅ Add/Edit/Remove |
| `coaches` | `getCoaches`, `getPendingReviews`, … | ✅ list + reviews | Parent only | ✅ Assign + manage per coach |
| `teams` | `getFeaturedTeam`, `getTeamMembers`, … | ✅ team + members + others | Parent only | ✅ Add team + add members |
| `tournaments` | `getActiveTournament`, bracket, … | ✅ tournament + bracket + mats | Parent only | 🟡 Create (demo client state) |
| `attendance` | `getAttendanceFormOptions`, `getAttendanceSessions` + client mark/history | ✅ per section | ✅ | ✅ Mark/edit + history |
| `gear` | inventory repos + `GearWorkspace` | ✅ items + movements + open issues | ✅ | ✅ Add / edit / delete / issue / return |
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
| `AssignCoachModal` | Assign | ✅ `api.coaches.assign` |
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
| **Drizzle migration journal drift** | High | `_journal.json` lists migrations `0000`–`0011`; DB `__drizzle_migrations` may only record first 3 — `pnpm db:migrate` can fail re-applying `0003+`. `0010`/`0011` may need manual apply in dev. Missing snapshots for `0004`–`0008`, `0010`, `0011`. |
| **Record fee payment** | Medium | UI button in `PlayerSidePanel`; no `feePayments` write repo or API |
| **Gateway vs Next.js mutation split** | Medium | Creates hit Next.js; reads can hit gateway — document for new endpoints; consider adding POST to people-service or dropping gateway for mutations |
| **`services/README.md` stale** | Low | Says "Next.js never talks to DB directly" — RSC pages now use repositories directly |
| **OTP auth** | Medium | Stub only (`lib/auth/otp.ts`); `phone_verified` never set true |
| **Password reset** | Medium | Login UI link with no flow |
| **Academy `loading.tsx` coverage** | Done | All child routes have route-specific skeletons; shared primitives in `components/academy/skeletons.tsx` |
| **State portal** | Expected | Entire `/state` tree uses mock data — no backend |
| **Reports (academy)** | Expected | Static template cards |
| **Inert action buttons** | Low | Quick add, Run payroll, Generate report, Review lineup, Open review queue |
| **Team metadata edit** | Low | No PATCH team name/coach/weight class |
| **Coach portal (M3)** | 🟡 Partial | `/coach/[id]/{home,players,attendance,teams}` — assignments, scoped players, attendance mark, teams CRUD; drill review queue not wired |
| **Middleware scope** | Low | `/auth/login` and `/auth/sign-up` not in matcher — public by design; academy membership not verified per-route in middleware (relies on API 403) |
---

## 10. Next recommended work

Priority order based on incomplete CRUD and user-facing stubs:

1. **Fix migration journal sync** — Reconcile `drizzle.__drizzle_migrations` with `db/migrations/meta/_journal.json`; generate missing snapshots so `pnpm db:migrate` is reliable on fresh clones.
2. **Record fee payment** — Repository + `POST .../players/[id]/payments` + wire side panel button; updates `feeInvoices` / `feePayments` and refreshes list.
3. **Coach update + drill review** — PATCH coach; POST review decision on `drillSubmissions`; wire `PendingReviewsPanel`.
4. **Team metadata edit** — PATCH team name, coach, weight class.
5. ~~**Extend `loading.tsx`**~~ — Done: coaches, tournaments, dashboard, teams, attendance, gear, fees.
6. **Gateway alignment** — Add mutation handlers to people/competitions services **or** stop proxying writes and document Next.js as sole mutation layer.
7. ~~**Payroll actions**~~ — Done: run payroll, approve payslip, staff CRUD, player fees billing.
8. ~~**Inventory writes** — Add item + issue/return gear against existing schema.~~ ✅ Done
9. ~~**State portal backend** — Replace `state-mock-data` with read repos~~ ✅ Done (state-aggregates + per-route repos)

---

## 11. Dev credentials (seeded)

| Role | Email | Password | Landing |
|------|-------|----------|---------|
| State admin | `state.department@gmail.com` | `khel@setu1234` | `/state` |
| Academy admin | `rajesh@dronacharya.in` (seed) | (see `db/seed`) | `/academy/{id}/dashboard` |

---

*This file is the single source of truth for project progress. Update it when shipping new CRUD surfaces or closing tech-debt items.*
