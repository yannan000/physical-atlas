# Physical Atlas

A deployable research discovery app for Physical AI, inspired by the useful interaction patterns of research atlases while using original branding, layout, copy, and visual identity.

## Features
- Domain views for robots, drones, autonomy, manipulation, embodied AI, and simulation
- Labs view grouped by organization metadata, with a transparent Independent & cross-lab fallback when affiliation is missing
- Live search powered by the public Hugging Face Papers endpoint, with a curated fallback
- Canonical paper links to Hugging Face and arXiv
- Optional typed classification via TypeSafe AI Jev through Vercel AI Gateway
- Responsive editorial UI

## Run
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Optional Jev integration
Set `AI_GATEWAY_API_KEY` in `.env.local`. The `/api/classify` route uses AI SDK 7's `experimental_evaluate` with `typesafe-ai/jev`, returning a typed domain choice and a boolean practical-system assessment. Requests enable Gateway zero-data-retention.

## Deploy
Import the project into Vercel or run `vercel`. Add `AI_GATEWAY_API_KEY` only if Jev classification is required.

## Data notes
The app queries Hugging Face Papers for interactive discovery. For production ingestion at scale, use arXiv's documented API, cache requests, respect its once-per-three-seconds limit, and deduplicate by canonical arXiv ID.

## Sources
- https://www.1kpapers.com/
- https://github.com/Nutlope/1kpapers
- https://vercel.com/changelog/typesafe-ai-jev-now-available-on-ai-gateway
- https://vercel.com/docs/ai-gateway/modalities/evaluation
- https://info.arxiv.org/help/api/user-manual.html
- https://huggingface.co/docs/hub/en/api
