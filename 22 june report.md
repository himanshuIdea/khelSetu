# Khel Setu — Product Progress Report

**As of:** 22 June 2026  
**Audience:** Stakeholders, operations, and programme leads (non-technical)

---

## In one minute

Khel Setu remains the multi-portal platform for **Haryana’s state sports department**, **academy admins**, **coaches**, and **athletes**. Since the last report (12 June), two major areas moved forward: the **state command centre** now supports **real report generation and fund release**, and **academy tournaments** went from a basic knockout view to a **full hosting workspace** covering all six competition formats used in Haryana-style events.

| Symbol | Meaning |
|--------|---------|
| **Live** | Users can complete the workflow today |
| **Partial** | Screen works; some actions or numbers are incomplete |
| **Planned** | Shown in UI only, or not built yet |

---

## What changed since 12 June

| Area | Before (12 Jun) | Now (22 Jun) |
|------|-----------------|--------------|
| **State → Reports** | “Generate report” not functional | **Live** — five report types export as PDF or Excel |
| **State → Funds** | “Release funds” placeholder | **Live** — pending disbursement release with confirmation |
| **State search** | Worked on Scouting only | **Live** across nurseries, athletes, districts, verification, scouting, funds, and reports |
| **State → Districts** | Table only; export planned | **Live** district table with header search |
| **Academy → Tournaments** | View & create; deeper management planned | **Live** immersive hosting for all six formats |
| **Tournament formats** | Knockout display only | Knockout, double elimination, round robin, pool→knockout, heats, trial/merit list |
| **Tournament ops** | — | Match labels, mat schedule, medal tally, mark winner, end tournament |
| **Double elimination** | Not modeled | Auto-advance winners; losers drop to losers bracket; Grand Final A/B routing |
| **Bracket editing** | — | Drag athletes between empty / TBD slots (no swap) |

---

## Who signs in where

| Portal | Sign-in page | Lands on |
|--------|--------------|----------|
| State department | State login | State overview |
| Academy admin | Admin login | Academy dashboard |
| Coach | Coach login | Coach home |
| Athlete | Athlete login | Athlete home |
| New academy | Sign up → onboarding | Profile setup, then state review |

**Live:** Password sign-in, sign-up, forced password change, correct redirect per role.  
**Partial:** OTP login (screen exists; real SMS not connected).  
**Planned:** Forgot password.

---

## State command centre (Sports Department)

| Screen | What it’s for | Live | Partial | Planned |
|--------|---------------|------|---------|---------|
| **Overview** | Statewide KPIs, district charts, verification summary, talent list, fund snapshot | Dashboards from live nursery & athlete data | Fund bars (some scheme lines still estimated); overview export button | — |
| **Sports nurseries** | Registry of all nurseries | List, filters, add/register, view detail, remove, search | — | — |
| **Athletes** | Statewide athlete roster | List, district/sport/rating filters, header search | First 100 athletes loaded; roster export button | Full roster pagination |
| **Talent scouting** | Shortlist athletes for programmes | Filters, status updates (single + bulk), shortlist Excel/PDF, search | — | — |
| **Verification** | Review new academies & nursery compliance | Approve onboarding; verify, flag, or clear nurseries; search | — | — |
| **Funds** | DBT-style disbursement view | Scholarship totals from real payments; coach pay from payroll; **release pending funds** | Diet % derived from scholarships; coach/equipment % are placeholders | Purpose-locked tokens panel |
| **Districts** | Per-district nurseries, athletes, coaches, verification | Full district table with search | Per-district PDF export from header | — |
| **Reports** | Compliance & analytics exports | **Generate** district, fund, talent, verification, and full-state reports (PDF/Excel); export history counts | Scheduled / automated exports | — |

### Fund utilisation — how numbers are calculated

Scholarship disbursement reflects **actual recorded payments**. Diet allowance %, coach utilisation %, equipment grant amounts, and “on-chain tokens” are **not yet tied to a formal state budget system**.

---

## Academy admin

| Area | Live | Partial | Planned |
|------|------|---------|---------|
| Dashboard & activity | ✓ | | |
| Players (add, edit, remove, profiles) | ✓ | Record fee from player profile (use Fees page instead) | |
| Attendance | ✓ | | |
| Fees & payroll | ✓ | | |
| Gear / inventory | ✓ | | |
| Login credentials for staff | ✓ | | |
| Coaches | Assign to sports/batches | Edit or remove coach | |
| Teams | Create team, manage roster & captain | Delete team | |
| **Tournaments** | **Create, host, and end tournaments in all six formats; mark winners; schedule & medals; drag athletes to empty slots** | Existing double-elimination brackets created before 22 Jun need a new tournament for auto-routing links | State-level tournament calendar integration |
| Academy reports | | | Not built (no reports screen yet) |
| Academy settings | | Edit profile after onboarding | |

### Tournament formats (academy)

| Format | What admins can do today |
|--------|--------------------------|
| **Knockout** | Bracket tree, tap-to-win, winner auto-advances |
| **Double elimination** | Winners + losers brackets, losers drop on loss, Grand Final slots |
| **Round robin** | Pool fixtures and standings |
| **Pool → knockout** | Group stage then elimination bracket |
| **Heats** | Lane/heat schedule; drag between empty lanes |
| **Trial / merit list** | Ranked selection list (no bracket drag) |

---

## Coach portal

| Area | Status |
|------|--------|
| Home & assignments | **Live** |
| Player list & details | **Live** |
| Attendance (own batches) | **Live** |
| Teams | **Live** |
| Review athlete video submissions | **Live** |
| Post & publish drills | **Live** |

---

## Athlete portal

| Area | Status |
|------|--------|
| Home feed | **Live** |
| Explore drills & athletes | **Live** |
| Submit training videos | **Live** |
| Drill library | **Live** |
| AI form analysis | **Partial** — UI and scores; limited analysis backend |
| Progress tracking | **Planned** — not built yet |
| Profile editing | **Partial** |

---

## What works well today

- Academy onboarding → state verification → nursery goes live on the state registry  
- State-wide visibility: nurseries, districts, verification queue, scouting pipeline  
- **State report generation** (PDF/Excel) from live statewide data  
- **Fund release** for pending scholarship disbursements  
- Academy operations: rosters, attendance, fees, gear, credentials  
- **Full tournament hosting** across six Haryana-relevant competition formats  
- Coach workflow: drills, reviews, attendance, teams  
- Athlete workflow: feed, explore, submit, drills  
- Scouting shortlist export (Excel/PDF) for programme teams  

---

## Known gaps (visible but not finished)

| Gap | Where users see it |
|-----|-------------------|
| Export overview / athlete roster from state header | State → Overview, Athletes |
| Per-district PDF from districts header | State → Districts |
| Scheduled / automated report runs | State → Reports |
| Purpose-locked benefit tokens | State → Funds (right panel) |
| Full state budget & scheme allocations | Funds dashboards (some % still estimated) |
| Forgot password | All login screens |
| Real OTP / SMS login | Login screens |
| Academy reports screen | Academy nav |
| Coach removal, team deletion, academy settings edit | Academy admin |
| Older double-elimination tournaments | Re-create tournament to get new bracket links |

---

## Recommended next priorities

1. **State exports polish** — Overview and athlete roster downloads from header buttons  
2. **Funds model** — Real allocations for diet, equipment, and coach schemes (replace placeholders)  
3. **Scheduled reports** — Cron-style generation from the report catalog  
4. **Auth** — Forgot password and live OTP  
5. **Academy polish** — Coach removal, team deletion, academy settings  
6. **State tournament layer** — Tie academy tournaments to district/state calendar (see `docs/context/haryana-tournament-management.md`)  

---

## Demo & pilot data

Dashboards are meaningful when nurseries, athletes, fee payments, and payroll exist in the system (Haryana pilot seed). Empty screens are expected on a fresh install until academies onboard and record transactions.

**Pilot note:** Demo environments may only include a **subset** of planned nurseries. Statewide totals and district coverage will look sparse until the full pilot seed is loaded. One academy (`ambala-1`) is set up with full depth for end-to-end demos.

**Tournament demo tip:** Create a **new** double-elimination tournament with four athletes to verify winners-bracket advance, losers-bracket drop, and drag-to-empty-slot placement.

---

*For technical implementation detail, see `WORKLOG.md`, `docs/context/haryana-tournament-management.md`, and `docs/sign-in-portals.md`.*
