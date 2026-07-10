# State Portal Demo — Voice-over Script

Playwright spec: [`state-portal-demo.spec.ts`](state-portal-demo.spec.ts)  
Pacing: cinematic (`slowMo: 500`, 4–6s holds on key beats)  
Viewport: 1280×800 desktop  
Search terms: **sonipat** (nurseries), **deepanshu** (scouting), **Sonipat** (districts)

Fill in **VO line** as you record narration.

---

## Act 1 — Marketing landing (~50s)

| Step | On-screen focus | Hold | VO line |
|------|-----------------|------|---------|
| 1 | Hero — KhelSetu heading, mission copy | 5s | |
| 2 | Language toggle → Hindi content | 5s | |
| 3 | Toggle back to English | 4s | |
| 4 | Scroll: hero → stats → portal features → how-it-works → CTA/footer | ~20s | |
| 5 | Click **Sign in** (rail or header) → login page | 4s | |

---

## Act 2 — Login (~15s)

| Step | On-screen focus | Hold | VO line |
|------|-----------------|------|---------|
| 6 | State dashboard sign-in split layout | 4s | |
| 7 | Type email + password (slow) | — | |
| 8 | **Continue** → redirect to `/state/overview` | 5s | |

---

## Act 3 — State overview (~12s, glance)

| Step | On-screen focus | Hold | VO line |
|------|-----------------|------|---------|
| 9 | Stat cards, sidebar nav visible | 5s | |
| 10 | Light scroll in main content | 2s | |

---

## Act 4 — Sports nurseries (~25s)

| Step | On-screen focus | Hold | VO line |
|------|-----------------|------|---------|
| 12 | Navigate **Sports nurseries** | 2.5s | |
| 13 | Header, filter pills | 4s | |
| 14 | Top search: type **sonipat** | 6s | |
| 15 | Filtered nursery rows | 4s | |
| 16 | Clear search | 2s | |

---

## Act 5 — Athletes (~40s)

| Step | On-screen focus | Hold | VO line |
|------|-----------------|------|---------|
| 17 | Navigate **Athletes** | 2.5s | |
| 18 | Sport filter → **Wrestling** | 1.5s | |
| 19 | District filter → **Sonipat** | 1.5s | |
| 20 | Rating slider → 8.5, table refetch | 6s | |
| 22 | Updated athlete list | 5s | |

---

## Act 6 — Talent scouting (~50s)

| Step | On-screen focus | Hold | VO line |
|------|-----------------|------|---------|
| 23 | Navigate **Talent scouting** | 2.5s | |
| 24 | Top search: type **deepanshu** | 6s | |
| 25 | Deepanshu row visible | 5s | |
| 26 | Status dropdown → **Khelo India** (saves to DB) | 6s | |
| 27 | Updated status pill | 5s | |
| 28 | Scouting stat tiles | 4s | |

---

## Act 7 — Verification (~45s)

| Step | On-screen focus | Hold | VO line |
|------|-----------------|------|---------|
| 29 | Navigate **Verification** | 2.5s | |
| 30 | Queue stats + table | 5s | |
| 31 | First row **Review** / **Manage** → modal opens | 5s | |
| 32 | Scroll modal: details → documents (read-only) | ~9s | |
| 33 | Close modal — no approve/reject | 2s | |

---

## Act 8 — Fund utilisation (~30s)

| Step | On-screen focus | Hold | VO line |
|------|-----------------|------|---------|
| 34 | Navigate **Fund utilisation** | 2.5s | |
| 35 | Scheme table overview | 5s | |
| 36 | Click **Padak Lao, Pad Pao** row → scheme detail | 6s | |
| 37 | Scheme header + pills only — **no scroll** | 6s | |
| 38 | **Back to funds** | 4s | |

---

## Act 9 — Districts (~25s)

| Step | On-screen focus | Hold | VO line |
|------|-----------------|------|---------|
| 39 | Navigate **Districts** | 2.5s | |
| 40 | Search **Sonipat** | 6s | |
| 41 | Scroll district table | 5s | |

---

## Act 10 — Reports + PDF (~35s)

| Step | On-screen focus | Hold | VO line |
|------|-----------------|------|---------|
| 42 | Navigate **Reports** | 2.5s | |
| 43 | Report catalog + stat cards | 5s | |
| 44 | **Full state report** → **Generate →** | 4s | |
| 45 | Popover → **PDF** | 4s | |
| 46–47 | **Download report** → PDF opens in new tab ~2.5s → tab closes | 2.5s | |
| 48 | **State overview** — closing hold | 4s | |

---

## Run

```bash
cd khel-setu
npm run demo:record              # build + record + copy video
DEMO_FRESH_SEED=1 npm run demo:record   # seed DB first (recommended)

npm run demo:record:test         # test only (server via Playwright)
```

**Outputs**

- Video: `e2e/demo/state-portal-demo.webm`
- PDF artifact: `e2e/demo/downloads/full-state-report.pdf`

**Requires:** `STATE_ADMIN_EMAIL` and `STATE_ADMIN_PASSWORD` in `.env`
