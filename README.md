# Physical Atlas

An illustrated, living index of Physical AI research — robots, drones and UAVs, autonomy, manipulation, embodied AI and simulation. Every paper carries a model-written brief (tl;dr, what changed, plain-English "so what", industry contribution, keywords) and a graphic generated from that brief. Inference runs on **GMI Cloud**.

```bash
npm install
npm run dev          # http://localhost:3000
npm run enrich       # briefs + graphics for the curated papers (fills gaps only)
npm run discover     # scan preprints, journals and proceedings for new papers, screen, brief, illustrate, index
```

Auth for the two scripts and `/api/summarize`: `GMI_API_KEY` in the environment or `.env.local`; failing that, the key the `gmi` CLI stores in `~/.config/gmi/.env` is used. Create one at console.gmicloud.ai → API Keys.

## What is in v2

- **Redesign (v1.3 palette).** The v1 palette and type are back on the v2 structure: cream paper `#f3f0e8`, ink `#171712`, blue `#2e54ff` for editorial labels and links, acid `#d7ff46` for anything a model wrote or drew, with Newsreader, Manrope and DM Mono. Generated graphics keep their navy ground and sit as 1 px ink-bordered tiles inside cream cards. Two voices, two marks: blue mono labels are the editor's; acid chips mark model output (briefs, tl;drs, graphics). A graphic-led card grid, a detail page per paper at `/papers/<slug>`, a page per lab at `/labs/<slug>`, fixed-height lab and industry cards, and a live feed with a "Summarise with model" button and four explicit states.
- **Model briefs on every curated paper** (`data/enriched.json`) written by `deepseek-ai/DeepSeek-V4-Flash` through the GMI OpenAI-compatible endpoint. The editor's own summary and industry note remain on the page; the model never replaces them.
- **One generated graphic per paper** (`public/graphics/<slug>.png`) rendered by `seedream-4-0-250828` through the GMI Studio request queue from the illustration brief the model wrote, in one house style, converted to PNG locally. Seedance is GMI's video model; Seedream is the image sibling used here.
- **Discovery pipeline** (`scripts/discover.mjs`) that pulls candidates from Hugging Face Papers, arXiv, Semantic Scholar and OpenAlex — including robotics journals and proceedings — dedupes them against the atlas, has the model screen each one for relevance and significance, then briefs and illustrates the keepers into `data/discovered.json`. They appear under **Index** on the site with a stable `D` number and are labelled as automatically screened, not editorially reviewed. The Index has full-text search over titles, venues, authors, keywords and briefs, filters by domain, model significance, year and source type (preprint vs journal/proceedings), four sort orders, and loads 48 cards at a time.

## Pipeline

```
lib/curatedLabs.ts ──► lib/papers.ts ──► scripts/enrich.mjs ──► data/enriched.json + public/graphics/*.png
                                              │  (GMI LLM: brief; GMI Studio: graphic)
sources: hf · arxiv · s2 · openalex ──► scripts/discover.mjs ──► data/discovered.json + public/graphics/*.png
                                              │  (dedupe → screen → brief → graphic)
lib/data.ts assembles both ──► app/page.tsx (views) · app/papers/[slug]/page.tsx (detail)
```

Shared plumbing lives in `scripts/gmi.mjs`: key loading, JSON chat completions with retry, the brief schema and prompt, the house illustration style, request-queue polling, PNG conversion.

### `npm run enrich`

| Flag | Effect |
|---|---|
| `--summaries` / `--graphics` | run only one pass |
| `--force` | regenerate everything, not just gaps |
| `--limit N` | first N curated papers |
| `--dry-run` | print the plan, spend nothing |

### `npm run discover`

| Flag | Default | Effect |
|---|---|---|
| `--source hf,arxiv,s2,openalex` | all | which sources to query |
| `--query "…"` (repeatable) | 19 built-in queries covering physical AI, manipulation, humanoids, legged, drones/UAVs, ground autonomy | what to search for |
| `--venue "…"` (repeatable) | Science Robotics, T-RO, RA-L, IJRR, CoRL, RSS, ICRA, IROS, Nature MI, Autonomous Robots, JFR, Nature, Science | venue filter for Semantic Scholar and OpenAlex |
| `--any-venue` | off | drop the venue filter |
| `--days N` | 90 | recency window |
| `--per-source N` | 40 | candidates taken per source per query |
| `--min-score N` | 3 | minimum model significance (1–5) to keep |
| `--max N` | 12 | new papers indexed per run (cost cap) |
| `--no-balance` | off | pure score order; by default keepers are picked round-robin across domains (robots, drones, autonomy, manipulation, embodied, simulation) so one hot topic cannot crowd out the rest |
| `--backlog-only` | off | skip fetching and screening; index straight from the backlog (used to push all 662 screened papers) |
| `--concurrency N` | 6 | parallel briefs and graphics |
| `--no-graphics` | off | skip image generation |
| `--dry-run` | off | fetch and dedupe only, no model calls |

`data/discovered.json` remembers three things between runs: `papers` (indexed), `backlog` (screened as relevant and significant but not yet indexed because of `--max`; the next run indexes from here first, without re-screening) and `rejected` (irrelevant or below `--min-score`; never re-screened). Semantic Scholar throttles unauthenticated clients; set `S2_API_KEY` or the script backs off and continues with the other sources.

### `npm run classify` — typed judgments with TypeSafe Jev

Every curated and discovered paper is judged by [TypeSafe Jev](https://docs.typesafe.ai), a System One model that returns typed answers with calibrated probabilities instead of text. Seven questions are asked together over the same state (title, venue, date, abstract):

| Question | Primitive | Used for |
|---|---|---|
| Is this Physical AI research? | Noul | keep / drop |
| Which domain (robots, manipulation, locomotion, drones, autonomy, embodied, simulation, other)? | Choice with rubric | domain filter; secondary domains ≥ 0.25 become extra tags |
| How significant, on five described levels? | Score | ★ filter and default sort |
| Results on real hardware? · Releases code/weights/data? · Survey or benchmark-only? · Built on a foundation model? | Noul ×4 | facet filters |

Raw probabilities are stored in `data/classified.json`; the thresholds that turn them into filters live in `POLICY` in `scripts/jev.mjs`, so `npm run classify -- --rethreshold` re-derives every filter with no API calls. When a Jev key is present, `npm run discover` also screens new candidates with the same judgments instead of the DeepSeek JSON prompt.

Auth, either of: `TYPESAFE_API_KEY` (direct, `jev-latest`) or `AI_GATEWAY_API_KEY` (Vercel AI Gateway, `typesafe-ai/jev`; the Vercel account must have a card on file or the gateway returns 403). Keys are read from the environment or `.env.local`.

| Flag | Effect |
|---|---|
| `--force` | re-judge everything (also happens automatically when the questions change) |
| `--curated` / `--discovered` | one set only |
| `--limit N`, `--concurrency N`, `--dry-run` | as elsewhere |
| `--rethreshold` | apply the current `POLICY` to stored probabilities, no API calls |

### Cost (list prices before the account discount)

- Brief: ~1,300 tokens on DeepSeek-V4-Flash, fractions of a cent.
- Graphic: $0.05 list per Seedream 4.0 image (billed ~$0.03 after discount). The 41 curated graphics cost about $1.25.
- Screening (DeepSeek fallback): one call per 10 candidates.
- Jev classification: the full atlas of 727 papers used 1.09M input and 131k output tokens in one run through api.typesafe.ai; see console.typesafe.ai for the account's rate.

## How the curated map is selected

An editorial shortlist, not a universal ranking. Inclusion uses five visible criteria: sustained primary research output, current activity, field-shaping systems/datasets/models/deployments, coverage across Physical AI areas rather than brand size, and accessible evidence from official lab pages or canonical paper metadata. Marketing and funding announcements are not evidence. Organization types stay explicit: `Research lab`, `Physical AI company`, `Open research infrastructure`. Five curated links are lab publication indexes rather than single papers; they stay on the lab cards as source links and are excluded from the paper count.

## Files

```
app/page.tsx                 home (server) → components/Atlas.tsx (client views: Papers · Index · Labs · Industry · Live feed)
app/papers/[slug]/page.tsx   per-paper page: graphic, brief, editor's notes or screening note, provenance
app/api/papers/route.ts      Hugging Face Papers proxy (hourly revalidation)
app/api/summarize/route.ts   on-demand brief for a live-feed paper via GMI
lib/curatedLabs.ts           the editorial data (labs, papers, summaries, industry notes, contributions)
lib/papers.ts                flat paper list + slugs + Enrichment type
lib/data.ts                  server-side assembly of curated + discovered + enrichment
lib/gmi.ts                   server-side GMI helpers for API routes
scripts/gmi.mjs              shared script plumbing (LLM, Studio queue, PNG)
scripts/enrich.mjs           curated papers → briefs + graphics
scripts/discover.mjs         multi-source discovery → screen (Jev or DeepSeek) → brief → graphic → index
scripts/jev.mjs              TypeSafe Jev questions, transports (direct / Vercel gateway) and the filter POLICY
scripts/classify.mjs         judge every paper with Jev → data/classified.json
data/enriched.json           briefs for curated papers
data/discovered.json         indexed discoveries + remembered rejections
data/classified.json         Jev judgments per paper (raw probabilities + derived filters)
public/graphics/*.png        generated graphics
SUMMARY.md, PAPERS_ASSEMBLED.md   editor-written per-paper documents (v1.2)
```

## Primary sources

Google DeepMind Robotics · Google Research · Physical Intelligence · NVIDIA Robotics Research · Toyota Research Institute · Stanford REAL · Berkeley RAIL · CMU Robotics Institute · MIT CSAIL · ETH Zürich RSL · UPenn GRASP · UZH RPG · Skild AI · Figure AI · 1X World Model Lab · Waymo Research · FieldAI · Hugging Face LeRobot · Prime Intellect — links are on each lab card and in `lib/curatedLabs.ts`.

Paper rights remain with their authors and publishers. Summaries and graphics are model-generated; the curated set is reviewed editorially, the discovered index is not, and the linked paper is always the source of truth.
