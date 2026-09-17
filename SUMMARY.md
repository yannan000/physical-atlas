# Physical Atlas — Research Summary (DeepSeek)

Summarized with `deepseek-ai/DeepSeek-V4-Flash` (via `gmi` model navigator) over all 24 curated papers across 19 labs.

## Thematic Synthesis of Physical AI Research (24 Papers)

### 1. Dominant Research Themes & Trends

The curated papers cluster around three major themes, with a clear trajectory from task-specific to generalist systems:

- **Foundation Models for Robotics (Vision-Language-Action & Generalist Agents)** — The largest and fastest-growing cluster. Research is moving from grounding language in affordances ("Do As I Can") to unified architectures that can control multiple embodiments and tasks (π0, Helix, RoboCat, OpenVLA). Key trend: scaling data, compute, and model capacity to achieve zero-shot generalization and self-improvement.

- **Simulation, Infrastructure & Open-Source Tools** — A critical enabler for scaling robot learning. NVIDIA's Isaac Lab and Sim provide high-fidelity, GPU-accelerated environments; LeRobot and INTELLECT-2 democratize datasets and distributed training. The theme reflects a field-wide push for reproducible, scalable benchmarks and compute-efficient methods.

- **Dexterity, Locomotion & Agile Control** — Focused on physical capabilities that go beyond tabletop manipulation: dexterous in-hand manipulation (Large Behavior Models, DexterityGen), wheeled-legged locomotion (ETH), high-speed drone flight (UZH), and full-body humanoid control (Figure AI, Skild AI). A sub-trend is the use of generative models (Dreamitate) to learn visuomotor policies from video.

### 2. Key Representative Papers per Theme

| Theme | Representative Papers & Milestones |
|-------|-----------------------------------|
| **Foundation Models / Generalist Agents** | **AutoRT (DeepMind, 2024)** — orchestrates multiple robots at scale using LLMs. **RoboCat (DeepMind, 2023)** — self-improving foundation agent. **π0 (Physical Intelligence, 2024)** — VLA flow model for general robot control. **OpenVLA (Stanford, 2024)** — open-source VLA model. **Helix (Figure AI, 2025)** — VLA for generalist humanoid control. **S1 (Skild AI, 2026)** — in-context learning for robotics. |
| **Simulation, Infrastructure & Tools** | **Isaac Lab (NVIDIA, 2025)** & **NVIDIA Isaac Sim (2026)** — GPU-accelerated simulation. **LeRobot (Hugging Face, 2026)** — open-source robot learning library. **INTELLECT-2 (Prime Intellect, 2025)** — distributed RL training. |
| **Dexterous Manipulation** | **Large Behavior Models (TRI, 2025)** — multitask dexterous manipulation. **Dreamitate (TRI, 2026)** — video generation for visuomotor policies. **DexterityGen (Berkeley, 2025)** — foundation controller for dexterity. |
| **Locomotion & Agile Control** | **Robust Autonomous Navigation (ETH, 2024)** — wheeled-legged locomotion. **High-Speed Flight in the Wild (UZH, 2021)** — aggressive drone flight. **One Model, Any Scenario (Skild AI, 2025)** — cross-robot locomotion. |
| **Embodied Reasoning & World Models** | **1X World Model (2025)** — world models for humanoids. **Enter the Mind Palace (FieldAI, 2025)** — embodied question answering. |

### 3. Evolution: From Single-Task to Foundation/Generalist Models

- **From task-specific to multi-task and generalist.** "Do As I Can" (2022) grounded language in affordances for narrow pick-and-place. By 2024, RoboCat and AutoRT showed self-improvement across hundreds of tasks and multiple arms; π0 and Helix unified vision/language/action across embodiments; S1 (2026) adds in-context learning without weight updates.

- **From model-specific to open infrastructure.** OpenVLA, LeRobot, and INTELLECT-2 lower barriers via open weights, standardized datasets, and distributed training.

- **From simulation to sim-to-real to foundation-in-sim.** Isaac Lab provides scalable GPU simulation; Dreamitate learns policies from offline video, reducing real-world interaction needs.

### 4. High-Level Takeaways

1. The field is converging on a recipe for generalist robots: large vision-language-action models scaled across embodiments with self-improvement loops.
2. Dexterous and agile control are catching up to manipulation (DexterityGen, Large Behavior Models).
3. Simulation and open-source infrastructure (Isaac Lab, LeRobot) are critical accelerants.
4. Generative models are being repurposed for action (Dreamitate, 1X World Model).
5. Safety, evaluation, and field deployment remain open challenges.
