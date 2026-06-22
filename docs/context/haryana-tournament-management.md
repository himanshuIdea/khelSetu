# Haryana Tournament Management — Agent Context

> **Purpose:** Ground KhelSetu tournament features in how sports competitions are actually structured and run in Haryana.  
> **Last updated:** 2026-06-22  
> **Sources:** External web/government research (cited below) + codebase inspection (paths listed in §6).

---

## 1. Overview — Haryana sports tournament ecosystem

Haryana treats sports as a state priority: high medal output at national/international events, large public infrastructure (block stadiums, district complexes, sports nurseries), and multiple parallel tournament pipelines (government calendar, school system, federation championships, Khelo India).

### Governing bodies (verified external)

| Body | Role |
|------|------|
| **Department of Sports & Youth Affairs, Haryana** | State calendar, schemes (CM Cup, KISCE trials, equipment grants), district sports officer network |
| **Haryana State Sports Council** | Apex body under the [Haryana Sports Council Act, 2016](https://www.indianchess.org/assets/docs/Gazette_-_Haryana_Sports_Council_Act_2016.672841.pdf) — coordinates promotion, infrastructure, competitions |
| **District Sports Councils (DSC)** | One per revenue district; organize district tournaments; coordinate block/municipal/town/corporation councils |
| **Block / Town / Municipal / Corporation Sports Councils** | Local-level coordination; clubs register here |
| **District Sports Officers (DSO)** | Operational contacts per district ([directory](https://haryanasports.gov.in/directory/)) |
| **School Education Department** | Separate **school sports** ladder: block → district → state school tournaments |
| **State sport associations** | Discipline-specific (e.g. HTTA table tennis, HSA swimming, Haryana Basketball) — run state championships, age rules, online entry |
| **SAI / KISCE centres** | Elite pipeline — trials and residential training (e.g. Bhiwani SAI, Panchkula KISCE) |

### Policy & programmes (verified external)

- **Annual sports calendar** published by the Sports Department — state-level events across wrestling, boxing, athletics, volleyball, swimming, badminton, marathons, etc. ([2025–26 calendar coverage](https://sgttimes.com/haryana-annual-sports-calendar-2025-26-released/)).
- **Haryana Sports & Physical Fitness Policy 2015** and related schemes listed on [haryanasports.gov.in](https://haryanasports.gov.in/) (equipment provision, adventure sports, Mission Olympics).
- **Khelo Haryana Games** — state-organized multi-sport event for **U-18** talent identification ahead of Khelo India; events hosted across multiple districts ([Tribune, Dec 2022](https://www.tribuneindia.com/news/haryana/stage-set-for-khelo-haryana-games-461415/)).
- **Khelo India Youth Games (KIYG)** — national U-18 event; Haryana hosted KIYG 2021 in Panchkula; state teams selected via trials / national qualification ([KIYG 2021 circular PDF](http://cmabsp.com/wp-content/uploads/2022/08/2021-Khelo-India-Youth-Games-Circular.pdf)).
- **Khelo India State Centre of Excellence (KISCE)** — annual athlete selection trials; registration via [haryanasports.gov.in](https://haryanasports.gov.in/registration-form-for-the-selection-of-athletes-in-khelo-india-state-centre-of-excellence-haryana-2026/).
- **Chief Minister's Cup** — state-level event (Feb 2026 inauguration at Tau Devi Lal Stadium, Gurugram; ~3,600 players, six sports, cash prizes for medalists — [news report](https://www.indianewscalling.com/news/181102-news-received-from-haryana-state-under-the-leadership-of-cmshnayab-singh-saini-and-other-news.aspx)).
- **Mission Olympics 2036 / “Vijayi Bhav”** — long-term athlete support (academies, insurance, medical, coaching).

### Infrastructure context (verified external)

- **171 block-level stadiums** with full-time coaches; **46 sports nurseries** (hostel, kit, food, training) — [Desai case study on Haryana sports policy](http://www.desai.com/innovation-applied/research/case-studies-Haryana-Sports.php).
- Every district has a sports complex; competitions rotate across district venues (Panchkula, Karnal, Ambala, Rohtak, etc.).

---

## 2. Tournament formats & competition structures

Real championships in Haryana use different **competition formats** depending on sport, age band, venue capacity, and event tier. KhelSetu must eventually support more than single-elimination brackets; today the academy Tournaments screen is wrestling-centric knockout only.

**Legend:** 🟢 verified Haryana practice (circular/news) · 🔵 general sports-admin knowledge · ⚪ KhelSetu codebase observation

### 2.1 Format taxonomy

| Format | Definition | Typical use in Haryana | KhelSetu UI concept | Codebase |
|--------|------------|------------------------|---------------------|----------|
| **Single elimination (knockout)** | One loss eliminates; winners advance through a bracket tree | 🟢 Wrestling dangal, district/state boxing; CM Cup combat finals; intra-academy selection bouts | **Bracket** (QF → SF → Final), **mat schedule**, per-bout scores | ⚪ **Read/display only** — demo default `"Knockout"`; `tournament_matches.round` + `nextMatchId`; no `format` enum on `tournaments` table |
| **Double elimination** | Athlete/team must lose twice; losers' bracket or repechage feeds back | 🔵 Some national boxing/kabaddi templates; uncommon at Haryana district level | Second bracket column or repechage panel | ❌ Not modeled |
| **Round robin (league / pools)** | All members of a group play each other; standings by points (W/L/D, sets, goal diff) | 🟢 Khelo Haryana team events (volleyball, basketball) — groups across districts; 🔵 school district leagues | **Pool / points table** per group | ❌ No pool or standings tables |
| **Pool play → knockout (hybrid)** | Round-robin groups; top *N* per pool advance to elimination phase | 🟢 Volleyball & basketball at district/state; 🔵 CM Cup team sports may run groups before semis/finals | **Pools tab** + **knockout bracket tab** | ❌ Not modeled |
| **League / points table** | Multi-fixture phase with cumulative standings (may not end in single final) | 🔵 Inter-school district leagues; less common for one-off state championships | Standings table + fixture list | 🟡 Partial — `team_fixtures` on **Teams** page, not Tournaments |
| **Heats / time trial → final** | Qualifying timings or distances; fastest advance; medal decided in final heat/final | 🟢 Swimming (HSA invitation circulars), athletics (Haryana Athletics online entry) — **merit lists**, not head-to-head brackets | **Lane/heat schedule** + **rankings table** | ❌ Bracket UI is wrong surface |
| **Trial + selection committee** | Observed performance → ranked merit list; no bracket | 🟢 KISCE trials, KIYG/state-team selection | **Scouting / verification** modules | ❌ Different product surface (not Tournaments) |
| **Weight / category divisions** | Parallel draws per weight (often × age × gender) | 🟢 Wrestling, boxing, judo, weightlifting — each class has its own mat queue | Section title `{weight} kg · {type} bracket`; one bracket panel per class | ⚪ `tournaments.weightClass` text; UI shows **one** bracket per active tournament |
| **Individual head-to-head** | One athlete vs one opponent per bout | 🟢 Combat sports, badminton/TT singles | Bracket leaf nodes = `playerA` / `playerB` | ⚪ `tournament_matches.playerAId/BId` |
| **Team vs team** | Squad fixture (sets, quarters, or aggregate) | 🟢 Volleyball, basketball, handball; school team championships | Fixture cards, line-ups, team medal tally | 🟡 `team_fixtures`, `lineup_suggestions`; not integrated into bracket view |

### 2.2 Haryana calendar sports → typical formats

Synthesized from annual calendar coverage, federation prospectuses, and Khelo Haryana reporting — not a single official matrix.

| Sport (state calendar) | Dominant format | Notes |
|------------------------|-----------------|-------|
| **Wrestling** | Single elimination by weight 🟢 | Multiple mats run in parallel; inter-academy seed naming matches this |
| **Boxing** | Single elimination by weight 🟢 | Double elimination appears at some national templates 🔵 |
| **Volleyball / Basketball** | Pool → knockout 🟢 | Khelo Haryana uses multi-district pool groups |
| **Swimming / Athletics** | Heats → final; merit list 🟢 | Federation portals publish timings/rankings, not brackets |
| **Badminton / Table tennis** | Group stage optional → knockout 🟢 | HTTA age flights + knockout draw on event day |
| **Kabaddi** | Knockout or league by tier 🔵 | Pro league differs from school/district knockouts |
| **Weightlifting / Judo** | Weight-class single elimination 🟢 | Same scheduling concerns as wrestling (mat/platform queue) |

### 2.3 Mapping formats → KhelSetu UI concepts

| Real-world artifact | KhelSetu component / data (today) | Gap |
|---------------------|-----------------------------------|-----|
| Knockout draw | `KnockoutHostPanel` + `TournamentMatchCard` (labeled SF/Final, winner UX, persisted PATCH) | Multi-bracket / weight-class tabs still single active tournament |
| Mat / court / lane queue | `TournamentOperationsModal` → `TournamentScheduleTimeline` + side strip (`getTournamentSchedule`, editable `scheduledAt` / `matLabel`, go-live) | No separate schedule entity; single live bout enforced |
| Academy medal tally | `TournamentMedalEditor` in ops modal (`PATCH …/medals`) + side preview | No district rollup; one row per host academy |
| Team fixtures | **Teams** page `team_fixtures` (optional `tournamentId`) | Not shown on Tournaments screen |
| Pool standings | `RoundRobinPanel` / `PoolKnockoutPanel` standings tables + labeled pool fixtures | Auto-advance from pool to knockout not wired |
| Heat sheet / start list | `HeatsPanel` lane cards (`Heat N · Lane L`) | Timing/scoring only via match row |
| Format selection on create | `CreateTournamentModal` + `competition_format` on `tournaments` | — |

**Key codebase facts (⚪):** Six formats supported (`knockout`, `round_robin`, `pool_knockout`, `double_elimination`, `heats`, `trial`). Match labels stored in `tournament_matches.match_label`. Read API: `getBracketMatches`, `getTournamentSchedule`, `getTournamentMedals`, `getTournamentStandings`. Write API: `PATCH …/matches/[matchId]`, `PATCH …/medals`.

### 2.4 Open product questions (formats)

1. **Persisted format enum** — Store `knockout | double_elimination | round_robin | pool_knockout | heats | trial` on `tournaments`, or separate `competition_events` per weight/pool?
2. **Multi-bracket tournaments** — One event with 8 weight classes: tabbed brackets vs separate tournament rows?
3. **Pool → knockout transition** — Auto-advance top *N* from standings, or manual seeding into bracket?
4. **State portal draw** — Can DSC run a **multi-district pool draw** with academies as units (see §4 district events)?
5. **UI switching** — Should non-knockout formats hide bracket entirely and show standings/heats (question also in §8)?
6. **Scoring models** — Bout scores (wrestling), set scores (volleyball), times (swimming) — one `tournament_matches` row shape or format-specific result tables?

---

## 3. Typical tournament hierarchy

```
National / Khelo India / Federation nationals
        ↑ selection / qualification
State championship / State school games / CM Cup / Khelo Haryana Games
        ↑ district winners / trials / merit lists
District championship / District school tournaments
        ↑ block / inter-school / local qualifiers
Block / Inter-academy / Club / Nursery internal events
```

### Council hierarchy (legal structure)

Per the **Haryana Sports Council Act, 2016**:

1. **State Sports Council** — state-wide competitions, delegation to districts, grants to institutions.
2. **District Sports Council** — “organize sports events, competitions or tournaments within the district”; coordinate lower councils.
3. **Block Sports Council** (and Corporation / Municipal / Town councils) — local clubs, grassroots events.

### Parallel school ladder

School Education Department runs **Block → District → State** school tournaments (separate calendar, birth-certificate eligibility, officials/judges assigned by department). Documents archived at [schooleducationharyana.gov.in/sports](https://schooleducationharyana.gov.in/sports/).

### Naming patterns (observed in official circulars)

- `{Nth} Haryana State {Sport} Championship {Year}` (e.g. 59th HERO State TT 2025)
- `{Sub-Junior|Junior|Senior} Haryana State {Sport} Championship`
- `State {Sport} Championship` + venue district
- `Khelo Haryana Games-{Year}`
- `Haryana Inter-Academy …` (KhelSetu seed naming — see §6)

---

## 4. Tournament types relevant to KhelSetu

| Type | Organizer | KhelSetu persona | Notes |
|------|-----------|------------------|-------|
| **Intra-academy / nursery internal** | Academy coach | **Academy admin** | Selection trials, weight-category bouts — closest to current UI (bracket + mat schedule) |
| **Inter-academy / district invitational** | Academy cluster or DSC | **Academy admin** | Seed data uses `Haryana Inter-Academy {sport}`; multiple academies, medal tally per academy |
| **District championship** | DSC + sport association | **State / district** (future) | District-wise teams; DSO logistics; often venue in district HQ |
| **State championship** | State association + Sports Dept | **State** (future) | Age-gated; online entry via federation portals |
| **School block/district/state** | School Education Dept | **State / school** (future) | Institution-based, not academy-ID based |
| **Khelo Haryana Games** | Sports Dept | **State scouting** | Mass U-18 event; multi-venue; feeds KIYG pipeline |
| **Khelo India / KISCE trials** | Sports Dept / SAI | **State scouting** | Trial-based selection, not knockout bracket — merit lists |
| **CM Cup** | State govt | **State** | High-visibility state event with cash awards |

### Age & weight categories (sport-specific — verified external)

There is **no single state-wide age matrix**; each federation sets cut-offs:

| Sport (example) | Categories |
|-----------------|------------|
| **Table tennis** (HTTA) | U-11, U-13 Cadet, U-15 Sub-Junior, U-17 Junior, U-19 Youth — DOB cut-offs per year ([prospectus](https://htta.in/assets/pdf/59th_HERO_Prospectus_state_2025.pdf)) |
| **Swimming** (HSA) | Sub-junior groups U-6 through U-12; Junior 13–17; Senior open 14+ ([2025 circular](https://hsa.org.in/EventCirculars/29062025_23_39_39_Invitation%20Sub%20Junior,%20Junior%20and%20Senior%20competition%202025%20.pdf)) |
| **Basketball** | Sub-Junior U-14, Youth U-17; Senior open ([HSBA](https://www.haryanabasketball.org/)) |
| **KIYG / Khelo Haryana** | U-18 (e.g. born on/after 1 Jan 2003 for KIYG 2021) |

**Weight classes** matter heavily for wrestling, boxing, weightlifting — mat scheduling and bracket weight divisions are realistic for those sports. Full format taxonomy: **§2**.

---

## 5. Management workflows (real-world)

Typical lifecycle for a **district or state championship** (synthesized from gazette, school dept notices, and federation circulars):

### 5.1 Creation & calendar

- Sports Department publishes **annual calendar** (dates, venues, disciplines).
- Federation or DSC issues **event circular / prospectus** (eligibility, fees, venue, draw date).
- For schools: revised calendar notices, fund allocation meetings, duty orders for judges/referees.

### 5.2 Registration & eligibility

- **Online entry** increasingly standard:
  - Athletics: [haryana.daasport.com / haryanaathletics.com](https://haryana.daasport.com/)
  - Table tennis: district association login on [htta.in](https://htta.in)
  - KISCE / state schemes: forms on [haryanasports.gov.in](https://haryanasports.gov.in/)
- **Documents:** original DOB certificate (school/municipal), bona-fide / school certificate, Aadhaar/KYC for state repository initiatives, sports registration with federation.
- **Entry fees** per event + annual player registration (e.g. HTTA ₹300/₹500).
- **Unit rule:** often one team per affiliated unit/club/district association.

### 5.3 Draws, fixtures & scheduling

- Draw published online on event date (HTTA) or at venue.
- **Mat / court / lane assignment** for combat and racquet sports.
- Multi-venue events (Khelo Haryana): each district hosts a subset of disciplines.
- Officials (referees, judges, selectors) assigned by department notices.

### 5.4 Results & advancement

- Bout winners advance in knockout; timed events produce merit lists.
- State championship results feed **state team selection** for nationals (may be separate from team event placement — e.g. HTTA singles rankings).
- Medal tallies often tracked **per district** or **per institution** at school/state games.

### 5.5 Certificates & records

- Participation / merit certificates from organizing council or federation.
- Medalists for CM Cup / state games may receive cash awards (state notification).
- Performance data feeds scouting (Khelo Haryana → KIYG → KISCE/TOPS).

### Workflow mapping → KhelSetu (aspirational)

| Real step | Current KhelSetu support |
|-----------|-------------------------|
| Create tournament | 🟡 Demo modal (client-only) |
| Register athletes / academies | ❌ |
| Generate bracket / draw | 🟡 Read seed bracket; demo editor |
| Mat schedule | ✅ Read + demo static schedule |
| Live scoring / advance winner | ❌ (display only) |
| Medal tally | ✅ Read per academy |
| Publish results / certificates | ❌ |
| State/district multi-academy view | ❌ |

---

## 6. What exists in KhelSetu codebase today

*Observations from repo inspection — not external facts.*

### 6.1 Routes & UI (Academy portal only)

| Path | Role |
|------|------|
| `app/academy/[id]/tournaments/page.tsx` | RSC page — `resolveAcademy` + tournament reads |
| `app/academy/[id]/tournaments/loading.tsx` | Skeleton: header, live card, split bracket + side panel |
| `components/academy/TournamentsWorkspace.tsx` | Client workspace — active tournament card, bracket, mat schedule, medal tally |
| `components/academy/TournamentsPageHeader.tsx` | Title + “Create tournament” CTA |
| `components/academy/CreateTournamentModal.tsx` | Demo MVP form (explicitly client-state, not persisted) |
| `components/academy/TournamentBracketEditor.tsx` | Interactive bracket editor (demo mode only — drag names, edit scores) |

**Page subtitle (product intent):** “Host inter- and intra-academy events with live brackets and mat scheduling.”

**UI structure:**

1. **Header** — Create tournament button  
2. **Live tournament card** — name, venue, dates, academy/athlete counts, “Live now” pill  
3. **Main panel** — `{weight} kg · {type} bracket` (QF → SF → Final); wrestling-oriented  
4. **Side panel** — “Mat schedule · today” + academy **medal tally** (gold/silver/bronze)

### 6.2 Data layer

| File | Status |
|------|--------|
| `lib/repositories/tournaments.ts` | **Read-only:** `getActiveTournament`, `getBracketMatches`, `getMatSchedule`, `getTournamentMedals`, `getActiveTournamentId` |
| `lib/tournaments-demo.ts` | Demo defaults (`Haryana Inter-Academy Wrestling Championship 2026`, Sonipat, knockout, 65 kg) |
| `db/schema/competitions/index.ts` | Full schema (see below) |
| `db/migrations/0006_competitions_teams_tournaments.sql` | Competitions schema migration |
| `db/seed/bulk/academy-factory.ts` | Seeds `Haryana Inter-Academy {sport} · {slug}` live tournament + sample QF match + medals |

**No write repository methods** for tournaments. `WORKLOG.md` marks create as “Demo MVP — client state modal”; score/advance as ❌.

### 6.3 Data model (`competitions` schema)

```
tournaments
  academyId, name, location, startDate, endDate, status (draft|live|completed|cancelled)
  sportId, weightClass, participantAcademies, participantAthletes

tournament_matches
  tournamentId, round, bracketPosition, matLabel, scheduledAt
  playerA/B (id + name), scores, winnerPlayerId, nextMatchId, medalType, status

tournament_medals
  tournamentId, academyId, gold, silver, bronze  (unique per tournament+academy in practice)

Related (Teams page):
  teams, team_members, team_fixtures (optional tournamentId), lineup_suggestions
```

**Gaps vs Haryana reality:**

- Tournaments scoped to **single `academyId`** (host) — no first-class district/state owner or multi-academy registration.
- No age category, gender, division, or federation affiliation fields.
- No registration / eligibility / document tracking.
- No non-knockout formats (heats, pools, trials) — see **§2** for full format gap analysis.
- `getActiveTournament` returns only one **`status = live`** tournament per academy.
- Medal tally indexed per tournament — not aggregated district/state level.

### 6.4 API & services

| Layer | Tournaments support |
|-------|---------------------|
| `services/competitions/index.ts` | GET active tournament, bracket, mat schedule, medals (port **4004**) |
| `lib/api/index.ts` | Gateway client `api.tournaments.*` (read proxies) |
| Next.js `app/api/v1/...` | **None** for tournaments (`WORKLOG.md`: gateway/microservice reads only) |

### 6.5 State portal

No tournament routes under `app/state/` or `components/state/` (grep: no matches). State features today focus on overview, verification, scouting, reports, funds — not competition management.

### 6.6 Progress tracking

- `WORKLOG.md` — Tournaments: read-only wired; create demo; bracket display only.
- `PROGRESS_REPORT.md` — “View & create | Deeper tournament management” (gap noted).
- `SEED_AUDIT.md` — 37 tournament rows in seed audit.

### 6.7 Related academy patterns to reuse

- **Teams** (`TeamsWorkspace`, `team_fixtures`) — opponent, venue, schedule; lineup suggestions for tournaments.
- **Shared UI** — `SplitLayout`, `SidePanel`, `EmptyState`, `PageHeader`, `Pill` (live/red/grey/amber variants for mat status).
- **Players** — weight category on player profiles (seed uses for tournament `weightClass`).

---

## 7. Mockup inventory

**Status: `KhelSetu_Mockups/` is referenced in `AGENTS.md` as the visual source of truth but is NOT present in this workspace** (no PNG/HTML mockup files found; zero images in repo root search).

Expected path per project docs: `KhelSetu_Mockups/screens/[name].png` — likely gitignored, stored elsewhere, or not yet added.

**Inferred UI from implemented academy Tournaments screen** (codebase-derived, not from PNG):

| Element | Description |
|---------|-------------|
| Page title | “Tournaments” |
| CTA | Primary “Create tournament” |
| Live card | Trophy icon, gradient badge, metadata row, red “Live now” pill |
| Bracket | Horizontal QF → SF → Final; dark final node; weight + format in section title |
| Mat schedule cards | Pill status (Live / Next / Final), time, bout label |
| Medal tally | Academy name + G/S/B counts in side panel footer |

If mockups are restored, compare against `components/academy/TournamentsWorkspace.tsx` for fidelity pass.

---

## 8. Implications & open questions for future work

### Product scope questions

1. **Which persona owns tournaments?** Academy-only (current) vs district/state creating events that academies enter?
2. **Inter-academy model:** Is the host academy the organizer with invited academies, or does DSC create and assign venues?
3. **School vs academy:** School tournaments use institution IDs and education dept workflow — same product or separate module?

### Data model questions

4. How to represent **age category** and **gender** (required for state eligibility)?
5. Separate **event** (state championship) from **participation** (academy/player registration)?
6. Support **non-bracket** formats (swimming heats, athletics trials) without forcing knockout UI — see **§2.4**.
7. **Multiple concurrent events** per academy vs single `live` tournament?

### Workflow questions

8. **Registration pipeline:** Online entry deadlines, fee payment, document upload — mirror HTTA/Athletics Haryana?
9. **Draw generation:** Manual seeding vs automated from rankings/weight class?
10. **Results → scouting:** Should state verification/scouting modules consume tournament results (link to `VerificationWorkspace` / `ScoutingWorkspace`)?

### UI questions

11. Restore **mockup PNGs** for polish pass — bracket column widths, responsive behavior at 320–1920px.
12. State-level **calendar view** (annual sports calendar) vs operational **bracket view**?
13. **Certificates / merit lists** — in scope or export-only?

### Suggested phasing (agent guidance, not a plan file)

- **Phase A (academy):** Persist create/update tournament; bracket CRUD; score entry advancing winners; multi-status list (draft/live/completed).
- **Phase B (inter-academy):** Participant academies, cross-academy medal tally, shared fixtures.
- **Phase C (state):** District/state event templates, age/gender rules, registration intake, calendar integration, scouting feed.

---

## Reference links (external)

| Resource | URL |
|----------|-----|
| Haryana Sports Council Act 2016 (Gazette PDF) | https://www.indianchess.org/assets/docs/Gazette_-_Haryana_Sports_Council_Act_2016.672841.pdf |
| Sports Department Haryana | https://haryanasports.gov.in/ |
| DSO directory | https://haryanasports.gov.in/directory/ |
| School sports (Secondary Education) | https://schooleducationharyana.gov.in/sports/ |
| Khelo Haryana Games 2022 (Tribune) | https://www.tribuneindia.com/news/haryana/stage-set-for-khelo-haryana-games-461415/ |
| KIYG 2021 selection circular | http://cmabsp.com/wp-content/uploads/2022/08/2021-Khelo-India-Youth-Games-Circular.pdf |
| KISCE 2026 registration | https://haryanasports.gov.in/registration-form-for-the-selection-of-athletes-in-khelo-india-state-centre-of-excellence-haryana-2026/ |
| HTTA State 2025 prospectus (age categories) | https://htta.in/assets/pdf/59th_HERO_Prospectus_state_2025.pdf |
| HSA Swimming 2025 invitation | https://hsa.org.in/EventCirculars/29062025_23_39_39_Invitation%20Sub%20Junior,%20Junior%20and%20Senior%20competition%202025%20.pdf |
| Athletics Haryana online entry | https://haryana.daasport.com/ |
| Annual calendar 2025–26 (news) | https://sgttimes.com/haryana-annual-sports-calendar-2025-26-released/ |

---

## Key codebase paths (quick index)

```
app/academy/[id]/tournaments/page.tsx
app/academy/[id]/tournaments/loading.tsx
components/academy/TournamentsWorkspace.tsx
components/academy/TournamentsPageHeader.tsx
components/academy/CreateTournamentModal.tsx
components/academy/TournamentBracketEditor.tsx
lib/repositories/tournaments.ts
lib/tournaments-demo.ts
db/schema/competitions/index.ts
db/migrations/0006_competitions_teams_tournaments.sql
db/seed/bulk/academy-factory.ts
services/competitions/index.ts
lib/api/index.ts          # api.tournaments.*
WORKLOG.md                # CRUD matrix
PROGRESS_REPORT.md        # feature gap
```
