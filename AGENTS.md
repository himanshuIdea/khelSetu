<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Khel Setu — Agent Guide

## Project structure

| Path | Purpose |
|------|---------|
| `khel-setu/` | Next.js app (App Router, RSC-first) |
| `khel-setu/app/` | Routes — `auth/`, `academy/[id]/` |
| `khel-setu/components/` | UI — `auth/`, `academy/` |
| `khel-setu/lib/repositories/` | Server data layer — **use directly on RSC pages** |
| `khel-setu/lib/auth-config.ts` | Auth/onboarding copy and step config |
| `KhelSetu_Mockups/` | Visual source of truth (PNGs, HTML, `base.css`) |
| `khel-setu/WORKLOG.md` | CRUD progress, session chronology, gaps, next work |
| `.cursor/skills/khelsetu-mockup-ui/SKILL.md` | Mockup fidelity, tokens, academy patterns |

## Workflow: batch by layer, not symptom

One pass per screen — behavior + layout + polish together. Do **not** split into separate passes for overflow, margins, columns, etc.

**Phases** (in order):

1. **Ship** — wire data, structure, empty states, core interactions
2. **Polish** — mockup fidelity (spacing, typography, column widths, responsive hide)
3. **Perf** — `lib/repositories/*` direct, `Promise.all`, `loading.tsx`, Suspense for slow panels

Extend the running agent's work on a file instead of spawning parallel duplicate tasks on the same screen.

## Task brief template

Copy-paste and fill before coding:

```markdown
## Goal
[One sentence: what ships when done]

## Screen / files
- Mockup: KhelSetu_Mockups/screens/[name].png
- Route: khel-setu/app/academy/[id]/[route]/page.tsx
- Components: khel-setu/components/academy/[...]

## Must have
- [ ] ...

## Must not break
- [ ] Existing nav, layout, other academy routes

## Data source
- [ ] lib/repositories/[name] — NOT api.* gateway on server pages

## Done when
- [ ] Matches mockup at lg+
- [ ] Empty states per section
- [ ] Responsive behavior below lg
- [ ] Acceptance checklist below passes

## Out of scope
- [ ] ...
```

## Front-load constraints

State these in the task brief before writing code:

- Mockup fidelity from `KhelSetu_Mockups/screens/`
- Academy RSC pages call `lib/repositories/*` directly — not `api.*` gateway (latency)
- `resolveAcademy` via `React cache()` + `getAcademyMeta` — do not duplicate per page
- Read paths use `listAcademyBatches`, not `ensureAcademyBatches`
- Dropdowns/menus portal to `document.body` (see `InlineSelect`, `FilterPillMenu`, `AdminAvatarMenu`)
- No native `<select>` / `<option>` / `<datalist>` for user-facing UI — use `InlineSelect`
- Empty states: shared `EmptyState` in `components/academy/shared.tsx`
- Attendance rates: guard with `Number(total) > 0` to avoid NaN

## Technical defaults

### Data layer (academy server pages)

```typescript
// ✅ RSC page
import { resolveAcademy } from "@/lib/repositories/resolve-academy";
import { getPlayers, getPlayerFormOptions } from "@/lib/repositories/players";

const [academy, players, formOptions] = await Promise.all([
  resolveAcademy(id),
  getPlayers(id),
  getPlayerFormOptions(id), // uses listAcademyBatches, read-only
]);

// ❌ Avoid on server pages
await api.academies.getPlayers(id); // gateway adds latency
```

### Client interactivity pattern (Players page)

- RSC `page.tsx` fetches list + form options
- `PlayersWorkspace` — client wrapper, selection state, `SplitLayout`
- `PlayerSidePanelClient` — fetches player detail on selection (keeps page fast)

### Performance

- `loading.tsx` per route (`app/academy/[id]/loading.tsx`, per-child routes)
- `Promise.all` for independent fetches
- `Suspense` boundaries for slow secondary panels
- `React.cache()` on `resolveAcademy` — shared across layout + pages in one request

### UI

- Tables: mockup column proportions at `lg+`; card list below `lg` (Players reference)
- Modals: lock `document.body.style.overflow`
- Filters/actions: `createPortal(menu, document.body)` to escape overflow clipping
- Privileged/destructive inline edits: confirm before commit (e.g. captain change on Teams — `InlineSelect` stays controlled on server value until `ChangeCaptainDialog` confirms; demotes prior captain in one transaction)

### UI controls (dropdowns)

Never use native `<select>`, `<option>`, or `<datalist>` for user-facing dropdowns.

| Control | Component | When |
|---------|-----------|------|
| Form field / table cell | `InlineSelect` | Modals, inline edits; `variant="input"` or `variant="pill"` |
| Modal labeled row | `InlineDropdown` | Wraps `InlineSelect` + `InlineRow` |
| Filter row | `FilterPillMenu` | Players list filters |

All dropdown menus portal to `document.body`, use 44px touch targets, support Escape to close, and show selected state with checkmark / `bg-brand-soft`.

## Responsive requirements

Full rules: `.cursor/rules/khelsetu-responsive.mdc`

| Breakpoint | Expectation |
|------------|-------------|
| 320–767px | No page-level horizontal overflow; card/stack layouts for dense lists |
| 768–1023px | Same mobile patterns unless mockup specifies tablet layout |
| 1024px+ | Mockup fidelity — table columns, side-by-side split layout |

Checklist (add to every academy screen task):

- [ ] Test at 320px, 375px, 768px, 1280px
- [ ] `min-w-0` on every flex child in `SplitLayout` chains
- [ ] `PageBody` padding respected — no negative margins breaking alignment
- [ ] Tables: `AcademyCardList` below `lg` **or** scroll contained inside card only
- [ ] Filter pills scroll horizontally with touch; last pill not clipped
- [ ] Side panel empty state hidden on mobile until selection
- [ ] `loading.tsx` skeleton matches mobile vs desktop layout

## Academy page acceptance checklist

Run before closing any academy screen task:

- [ ] Mockup PNG open side-by-side; structure and copy match
- [ ] Server page imports from `lib/repositories/*`, not gateway
- [ ] `resolveAcademy(id)` used (not raw `getAcademyMeta` + duplicate notFound)
- [ ] Independent data fetches wrapped in `Promise.all`
- [ ] `loading.tsx` exists for the route
- [ ] Each list/section has context-specific `EmptyState` copy
- [ ] Dropdown menus portal to `document.body` (`InlineSelect` / `FilterPillMenu` — no native `<select>`)
- [ ] Table columns match mockup widths at `lg+`; card list below `lg` where applicable
- [ ] Responsive checklist (`khelsetu-responsive.mdc`) passes at 320 / 375 / 768 / 1280px
- [ ] No `ensureAcademyBatches` on read-only paths
- [ ] Percentage/rate displays guarded against divide-by-zero (`Number(total) > 0`)
- [ ] Client state isolated in `*Workspace` / `*Client` components; RSC page stays thin

## Related docs

- **Mockup UI skill:** `.cursor/skills/khelsetu-mockup-ui/SKILL.md`
- **Workflow rule:** `.cursor/rules/khelsetu-workflow.mdc` (always on)
- **Academy UI rule:** `.cursor/rules/khelsetu-academy-ui.mdc` (academy paths)
- **Responsive rule:** `.cursor/rules/khelsetu-responsive.mdc` (always on)
