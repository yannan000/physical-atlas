# Physical Atlas

A living index of Physical AI research across robots, drones, autonomous systems, manipulation, embodied AI, and simulation.

## What changed in v1.1

- Preserves the live Hugging Face Papers discovery feed and domain search.
- Adds a curated map of leading research labs, Physical AI companies, and open-research infrastructure.
- Includes representative research links and a first-party research or publication source for every entry.
- Keeps organization signals from the live feed separate from curated identities, avoiding guessed affiliations.
- Labels Prime Intellect as adjacent open training infrastructure, not as a Physical AI research lab. Its published technical evidence is currently focused on distributed AI training.

## How the curated map is selected

This is an editorial shortlist, not a universal ranking. Inclusion uses five visible criteria:

1. Sustained primary research output.
2. Current research activity.
3. Field-shaping systems, datasets, models, or real-world deployments.
4. Coverage across Physical AI areas rather than brand size or funding.
5. Accessible evidence from official lab/publication pages or canonical paper metadata.

Company marketing and funding announcements are not treated as research evidence. Broad publication indexes, including NVIDIA Research, are filtered to Physical AI work in robotics, simulation, embodied systems, autonomy, manipulation, and related learning methods rather than ingested wholesale. Organization types remain explicit: `Research lab`, `Physical AI company`, or `Open research infrastructure`.

## Primary sources

- Google DeepMind Robotics: https://deepmind.google/research/publications/48151/
- Physical Intelligence: https://www.pi.website/research
- NVIDIA Robotics Research: https://research.nvidia.com/publications
- Toyota Research Institute: https://www.tri.global/publications
- Stanford REAL: https://real.stanford.edu/
- Berkeley RAIL: https://rail.eecs.berkeley.edu/publications.html
- CMU Robotics Institute: https://publications.ri.cmu.edu/
- MIT CSAIL: https://publications.csail.mit.edu/
- ETH Zürich Robotic Systems Lab: https://rsl.ethz.ch/publications-sources.html
- UPenn GRASP: https://www.grasp.upenn.edu/publications/
- UZH Robotics and Perception Group: https://rpg.ifi.uzh.ch/publications.html
- Skild AI: https://www.skild.ai/blogs/one-policy-all-scenarios
- Figure AI: https://www.figure.ai/news/helix
- 1X World Model Lab: https://www.1x.tech/discover/1x-world-model-lab
- Waymo Research: https://waymo.com/research/
- FieldAI Research Institute: https://www.fieldai.com/fairi
- Hugging Face LeRobot: https://huggingface.co/lerobot/papers
- Prime Intellect: https://www.primeintellect.ai/blog

## Data and optional classification

The live feed uses the public Hugging Face Papers API. `AI_GATEWAY_API_KEY` is optional and remains unset in production; without it, `/api/classify` intentionally returns a 503 disabled response. No secrets are committed.

```bash
npm install
npm run dev
```
