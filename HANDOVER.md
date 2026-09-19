# Handover: Physical Atlas v1.3 design → code

For a Claude Code session implementing the design canvas in this Next.js app.
Design canvas (source of truth for layout, copy placement and states):
https://claude.ai/code/artifact/b54df611-ae15-4fce-b5a3-d325c9d0ba48

Read this file, then `app/styles.css`, `components/Atlas.tsx`, `app/papers/[slug]/page.tsx`, `lib/data.ts`, `lib/curatedLabs.ts` before changing anything.

## 1. Where the codebase is

Two states exist side by side. Do not lose either.

| State | What it is | Where |
|---|---|---|
| Committed `688e79b` (v1.2) | Cream/ink/blue/acid site, Newsreader + DM Mono + Manrope. Views: domains, labs, industry, live feed. | `git show 688e79b:app/styles.css`, `git show 688e79b:app/page.tsx` |
| Uncommitted working tree (v2, from a parallel session) | Illustrated atlas: model briefs + Seedream graphics per paper, `/papers/[slug]` page, discovered index, live feed with "Summarise with GMI". Styled dark navy with Instrument Serif and Inter. | `components/Atlas.tsx`, `app/papers/[slug]/page.tsx`, `lib/data.ts`, `lib/papers.ts`, `lib/gmi.ts`, `scripts/*.mjs`, `data/enriched.json`, `public/graphics/*.png` |

**Decision (owner, 2026-09-18): keep v2's structure and data pipeline, restore v1's palette and type.** Generated graphics keep their navy ground and sit as bordered tiles inside cream cards.

Before starting: `git stash list` / `git status`. Work on the uncommitted v2 tree. Do not `git checkout` any modified file. Commit only when the owner asks.

## 2. Design tokens

Replace the `:root` block in `app/styles.css` with these. Keep every v2 class name so `Atlas.tsx` and the paper page keep working; restyle the classes, do not rename them.

| Token | Value | Usage |
|---|---|---|
| `--paper` | `#f3f0e8` | Page and card ground |
| `--ink` | `#171712` | Text, 1 px rules, filled buttons |
| `--blue` | `#2e54ff` | Links, editorial labels (lab name, section numbers, "Industry contribution" label), active nav |
| `--acid` | `#d7ff46` | Model-generated marker chips, active filter, LIVE badge, industry 2 px rule |
| `--line` | `#c9c4b8` | Secondary hairlines between list rows, tag borders |
| `--muted` | `#4a4841` | All secondary text. Never lighter: `#777` and `#9aa7bd` fail 4.5:1 on paper. |
| `--navy` | `#0b1730` | Graphic tile ground only. Never a page or card background. |
| `--white` | `#ffffff` | Search field, model-brief block, industry paper chips |
| `--serif` | `Newsreader` (opsz 6..72, wght 500) | Display, card titles, paper titles, stat numbers, lede |
| `--sans` | `Manrope` 400/500/600 | Body, summaries |
| `--mono` | `DM Mono` 400/500 | Labels, counts, years, chips, nav, buttons. Uppercase with tracking `.08em` to `.16em`. |

Google Fonts import (replace the Instrument Serif/Inter/JetBrains line):
```
https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,500;1,6..72,500&display=swap
```

Type scale (px / line-height):

| Role | Spec |
|---|---|
| Hero h1 | serif 500, clamp(64, 6.5vw, 84) / 0.88, tracking -0.05em, `em` in blue |
| Section h2 | serif 500, 54 / 1, tracking -0.03em |
| Lab/industry card h3 | serif 500, 30 / 1.05 (industry 27) |
| Paper card h3 | serif 500, 20 / 1.15 |
| Paper title in lab card | serif 500, 15 / 1.3 |
| Paper page h1 | serif 500, 52 / 0.98 |
| Body | sans 13 / 1.5, colour `--muted`; 12 inside cards |
| Label | mono 10 or 9, uppercase, tracking .08em to .12em |

Shape rules: no border radius anywhere, no box shadows except the search field's `5px 5px 0 var(--ink)`, no gradients, no `backdrop-filter` tints on navy. Grids use shared hairlines: container gets `border-top` and `border-left` in ink, each cell gets `border-right` and `border-bottom`.

`color-scheme` becomes `light`. Remove `.hero::before` grid mask and the `.mosaic` rotation.

## 3. Two voices, two marks

This rule runs through every surface. Implement it once as two small classes.

| Mark | Meaning | Spec |
|---|---|---|
| `.ed` blue mono label | The editor wrote this | mono 9–10, uppercase, `color: var(--blue)` |
| `.model` acid chip | A model wrote or drew this | mono 8–9, uppercase, `background: var(--acid); color: var(--ink); padding: 3px 6px` |

Places the acid chip must appear: header "MODEL" badge before the model names; `SEEDREAM 4.0` on the bottom-right of every graphic tile; `Model tl;dr` beside the tl;dr on the paper page; a small `Model` chip beside each of the three model-written section headings on the paper page; `Model brief` on the live-feed brief block; `SEEDREAM 4.0 · GMI STUDIO` in the paper page figcaption.

## 4. Surfaces

### 4.1 Header (`.hdr`) — artboards 04, 06

72 px, ink bottom rule, sticky. Brand `PHYSICAL` weight 600 + `ATLAS` weight 400 in blue, tracking -0.06em, 22 px. Nav: mono 12, tracking .08em, uppercase, gap 30; active item blue with underline offset 6 px. Right: acid `MODEL` chip + `DEEPSEEK-V4-FLASH · SEEDREAM-4.0 · GMI CLOUD` in mono 10 muted. Under 720 px hide the model line, keep nav.

### 4.2 Illustrated home (`Atlas.tsx` hero + papers view) — artboard 04

- Hero grid `1.1fr 0.9fr`, gap 56, padding `64px var(--gutter) 56px`, ink bottom rule.
- Eyebrow mono 11, tracking .16em. h1 as above. Lede: serif 19 / 1.45, max-width 560, ink (not muted).
- Stats: 5 cells in one ink-bordered row, each `b` serif 30 and mono 9 label. Cells separated by ink `border-right`.
- Mosaic: 3 columns, gap 12, no rotation. Tiles 2 and 5 get `margin-top: 24px`. Tile = `aspect-ratio: 1; background: var(--navy); border: 1px solid var(--ink); overflow: hidden`. Number badge bottom-left: mono 10 on acid.
- Section head: grid `1fr 2fr`, mono number left, h2 + p right.
- Tools row: search 52 px tall, white, ink border, ink offset shadow, acid count `kbd`. Kind filters are a joined button group (ink border, `border-left: 0` on siblings), active = ink fill with paper text. Replace the pill `.chip` styling; keep the class.
- Grid: `repeat(4, minmax(0,1fr))` with shared hairlines; 3 columns under 1100 px, 2 under 800, 1 under 520. Card height 520 at 4-up; let it be `min-height` so long titles never clip.

### 4.3 Paper card (`Card` in `Atlas.tsx`) — artboard 05

Anatomy top to bottom, padding 14, gap 12:
1. Tile (square, navy, ink border). Top-left number badge: paper on mono 10 with ink border, `D`-prefixed for discovered. Bottom-right acid `SEEDREAM 4.0` chip when a graphic exists.
2. Meta row: lab name as `.ed` blue label, year muted, both mono 9.
3. Title serif 20.
4. tl;dr (falls back to editor summary) sans 12 muted.
5. Keyword chips, `margin-top: auto`, mono 9, `--line` border, max 3 on the card.

Variants:

| Variant | Difference |
|---|---|
| Curated | as above, solid ink border in the grid |
| Discovered | `border: 1px dashed var(--ink)` on the card; stars row `★★★★☆` (mono 10, ink) with `domain · ▲upvotes · N cit.` muted uppercase; footer line `Affiliation as reported · not editorially verified` above a `--line` rule; venue replaces lab in meta |
| Pending graphic | tile shows italic serif `φ` 120 px in blue centred on navy; bottom-right chip is paper/ink outline `GRAPHIC PENDING` (not acid: nothing was drawn yet) |

Hover: title turns blue. No translate, no border colour change.

### 4.4 Lab card (labs view) — artboard 01

Fixes the v1.2 bug where one lab with 8 papers stretched its row to ~1,800 px.

- Grid 3-up with shared hairlines; card `height: 640px`, padding 20, `display:flex; flex-direction:column`.
- Top row: index mono 10 left; kind badge right. `Research lab` and `Open research infrastructure` = ink outline; `Physical AI company` = blue fill, white text.
- h3 serif 30 `margin: 28px 0 10px`; why sans 12 muted; focus tags mono 9 `--line` border.
- Papers block `margin-top: 24px; flex-grow: 1`: show **the two most recent papers with an `impact`**, each with title (serif 15) + `year ↗` (mono 10), summary (sans 12 muted), and the industry block: 2 px acid bar left, blue `Industry contribution` label, ink text. Sort by year desc, `Live` last.
- Source-index entries (no `impact`) are never counted as papers. If a lab has only index entries, show the index entry with an ink-filled `SOURCE INDEX` chip and a muted `No featured paper yet` block so the card does not look empty.
- Footer pinned bottom with ink top rule: `All N papers →` (mono 11, ink) linking to the lab page, then the source link in blue with `↗`.
- Use the 52 px graphic thumbnails from v2 (`p.graphic`) at the left of each paper row if present; navy ground, ink border.

### 4.5 Lab page (new route `app/labs/[slug]/page.tsx`) — artboard 03

Add `slug` to labs in `lib/data.ts getLabs` using `slugify(lab.name)` from `lib/papers.ts`.

- Header as 4.1. Hero grid `1fr 2fr`, ink bottom rule: left has `← LABS / NN` crumb, kind badge, `N PAPERS · YYYY–YYYY` mono, focus tags, source link; right has h1 serif 72 / 0.9 and the `why` as serif 20 lede.
- Ledger: grid `48px 1.1fr 1fr`, gap 24. Column heads mono 10 muted: `No.`, `Paper · what it does and shows`, `Industry contribution` (blue). Rows padding 18, first row ink top rule, later rows `--line`, last row ink bottom rule. Number blue mono 11. Title serif 20 with `year ↗`. Summary sans 13 muted. Contribution with 2 px acid bar, sans 13 ink.
- Every paper title links to `/papers/[slug]` when a slug exists, else the external url.

### 4.6 Industry card (industry view) — artboard 02

Fixes headings colliding with body on two-line titles.

- 3-up shared-hairline grid, card `min-height: 400px`, padding 20.
- Top row: index left; kind as blue mono 10 label, weight 500.
- h3 serif 27 `margin: 28px 0 16px` (fixed 16 below, whatever the line count). Body sans 12 muted.
- Chips pinned bottom above a `--line` top rule with `padding-top: 16px`: mono 9, ink border, white fill, uppercase. Each chip is an `<a>` to the paper it names; resolve by title match against `atlasPapers`, fall back to the lab source.

### 4.7 Paper page (`app/papers/[slug]/page.tsx`) — artboard 06

- Grid `1fr 1.15fr`, gap 56, padding `40px var(--gutter) 48px`. Left column sticky at `top: 88px` above 1024 px.
- Figure: ink border, navy ground, square image. Figcaption on paper with ink top rule: `Paper NN of 41` left, acid `SEEDREAM 4.0 · GMI STUDIO` right, mono 9.
- `details` "Illustration brief the model wrote": `--line` border, summary mono 9 uppercase ink, body sans 12 muted.
- Provenance box moves to the **left column under the details** (v2 has it bottom-right). `--line` border, mono 10 / 1.7 muted, `Provenance.` in ink weight 500.
- Right: crumbs mono 10 (lab in blue); h1 serif 52; tl;dr row = acid `Model tl;dr` chip + serif 21 text; keyword chips mono 9.
- Three model sections separated by rules (first ink, then `--line`): heading = blue mono 10 `.ed` + tiny acid `Model` chip; body sans 15 / 1.6 ink.
- Editor's notes section after an ink rule: blue label, `Summary.` paragraph muted with bold ink lead-in, `Industry.` paragraph with the 2 px acid bar. **Never replaced by the model brief, never above it.**
- Buttons: joined group. `Read the paper ↗` ink fill / paper text; source link ink outline, blue text. Both mono 11 uppercase, padding `14px 18px`.
- Prev/next: full-width two-cell row, ink top rule, ink divider; 72 px navy thumbnails with ink border; `← Previous · NN` / `Next · NN →` blue mono 9; title serif 17.

### 4.8 Live feed (`LiveFeed` in `Atlas.tsx`) — artboard 07

- Search as 4.2 with acid `LIVE` kbd.
- Rows: grid `48px 1fr 200px`, gap 20, padding 20, ink top rule on the list, `--line` between rows, ink bottom rule. Rank blue mono 11. Title serif 22 (link). Abstract sans 12 muted, 2-line clamp. Authors mono 9 muted. Right: upvotes serif 24, date mono 9, then the button.
- Button states, all mono 10 uppercase, 44 px tall:

| State | Spec |
|---|---|
| Idle | `Summarise with model`, ink outline, transparent |
| Writing | `Writing…`, `--line` border, muted text, `disabled` |
| Brief shown | button removed; block under the abstract: white fill, ink border, padding `12px 14px`; header row = acid `Model brief` chip + `DeepSeek-V4-Flash · cached` mono 9 muted; tl;dr sans 13 ink; so-what sans 13 muted |
| Unavailable | dashed ink border block, outline chip `Model brief unavailable`, message in muted sans 13 (the API `reason` string, e.g. `Set GMI_API_KEY to enable model summaries.`) |

Copy: the button says `Summarise with model`, not a vendor name; the vendor stays in the header line.

### 4.9 Method and footer

Method section: paper ground (not navy), h2 serif with blue `em`, four steps with ink top rules, step labels blue mono 11, `code` in mono 12 ink on `--line` background. Footer: 3-column grid, mono 10 muted, ink top rule.

## 5. Responsive

| Breakpoint | Change |
|---|---|
| > 1100 | As drawn (1280 artboards) |
| 800–1100 | Paper grid 3-up; lab, industry grids 2-up; hero stacks with mosaic below, no offset tiles; paper page single column, figure max-width 560, not sticky |
| 520–800 | Paper grid 2-up; lab, industry 1-up; nav hides (keep a `Menu` button if v2 has none, otherwise leave as v1 did); live feed rows `32px 1fr` with the right column moving under the text as a row |
| < 520 | Everything 1-up; stats 2 per row; joined button groups wrap and become full-width stacked |

Cards keep fixed heights only at ≥ 800; below, use `min-height`.

## 6. Accessibility

- Every card is a single `<a>`; tiles have empty `alt` (decorative) except the paper-page figure: `alt="Generated illustration for {title}"`.
- Filter groups: real `<button>`s with `aria-pressed`. Live feed button: `aria-busy="true"` while writing, `aria-live="polite"` region around the brief block.
- Contrast: secondary text is `#4a4841` on `#f3f0e8` (7.6:1). Acid chips use ink text. Blue on paper is 5.5:1; do not use blue text below 12 px on white tiles.
- Focus rings: `outline: 2px solid var(--blue); outline-offset: 2px` on links and buttons; do not remove the default without this.
- Stars row has `title="model significance score"` and an `aria-label="4 of 5"`.

## 7. Files to touch, in order

1. `app/styles.css` — tokens, fonts, restyle every existing class. No renames.
2. `components/Atlas.tsx` — header model chip; hero mosaic (no rotation); filter group markup; `Card` variants (dashed border, stars, pending chip); lab card cap to 2 papers + `All N papers →` + source-index empty state; industry chips as links; live feed states and button copy.
3. `lib/data.ts` — add `slug` to `LabView`; expose sorted `featuredPapers` (2 most recent with impact) and `paperCount` per lab.
4. `app/labs/[slug]/page.tsx` — new lab page (4.5). Add `generateStaticParams`.
5. `app/papers/[slug]/page.tsx` — provenance to left column, acid chips, editor's notes placement, joined buttons, prev/next row.
6. `README.md` — the parallel session already rewrote it for v2; add a "v1.3 palette" paragraph and remove the "dark navy ground, Instrument Serif" sentence.

## 8. Acceptance checklist

- [ ] No `#070e1c`, `#0b1730` (outside `.tile`/figure grounds), Instrument Serif, Inter or JetBrains Mono left in `app/styles.css`.
- [ ] Labs view: every row of cards is level at 1280; Physical Intelligence shows 2 papers and `All 8 papers →`; CMU shows the source-index state.
- [ ] Industry view: `VLA-controlled humanoids in manufacturing` wraps to two lines without touching the body.
- [ ] Paper cards: curated, discovered (dashed) and pending (φ) all render from the same `Card`.
- [ ] Paper page: editor's notes present and below the model brief; provenance in left column.
- [ ] Live feed: the four button states reachable (unset `GMI_API_KEY` to see Unavailable).
- [ ] `npm run build` passes; `npx tsc --noEmit` clean.
- [ ] Screenshots at 1280 of home, labs, industry, one paper page, one lab page saved to `preview/` (gitignored) and compared against artboards 04, 01, 02, 06, 03.

## 9. Out of scope for this pass

Domain view redesign (v2 dropped it; keep it dropped unless asked). Any change to `scripts/*.mjs`, the GMI calls, or `data/*.json`. Dark mode.
