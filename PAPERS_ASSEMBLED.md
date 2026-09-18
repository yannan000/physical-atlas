# Physical Atlas — All Curated Papers (41 papers + 5 source indexes)

Every paper below has a matching numbered entry in `SUMMARY.md` with its title, lab, summary and contribution to industry. The data behind both documents is `lib/curatedLabs.ts`, which the site renders per paper in the lab view.

## LABS AND THEIR FEATURED PAPERS

### Google DeepMind Robotics (Research lab)
Focus: embodied AI, manipulation, generalist agents

- [2024] AutoRT: Embodied Foundation Models for Large Scale Orchestration
- [2023] RoboCat: A Self-Improving Foundation Agent for Robotic Manipulation
- [2022] RT-1: Robotics Transformer for Real-World Control at Scale
- [2023] RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control
- [2023] Open X-Embodiment: Robotic Learning Datasets and RT-X Models

### Google Research (Research lab)
Focus: language-conditioned robotics, embodied AI, affordance grounding

- [2022] Do As I Can, Not As I Say: Grounding Language in Robotic Affordances
- [Index] PaLM-SayCan project page

### Physical Intelligence (Physical AI company)
Focus: vision-language-action, robot learning, manipulation

- [2024] π0: A Vision-Language-Action Flow Model for General Robot Control
- [2024] FAST: Efficient Robot Action Tokenization
- [2025] Teaching Robots to Listen and Think Harder (Hi Robot)
- [2025] Emergence of Human to Robot Transfer in VLAs
- [2025] VLAs that Train Fast, Run Fast, and Generalize Better (knowledge insulation)
- [2026] VLAs with Long and Short-Term Memory (MEM)
- [2025] Real-Time Action Chunking with Large Models (RTC)
- [2026] Precise Manipulation with Efficient Online RL (RLT)

### NVIDIA Robotics Research (Research lab)
Focus: simulation, robot learning, sim-to-real

- [2025] Isaac Lab: A GPU-Accelerated Simulation Framework for Multi-Modal Robot Learning
- [2026] NVIDIA Isaac Sim: Enabling Scalable, GPU-Accelerated Simulation for Robotics (independent survey, not an NVIDIA publication)

### Toyota Research Institute Robotics (Research lab)
Focus: large behavior models, dexterous manipulation, human assistance

- [2025] A Careful Examination of Large Behavior Models for Multitask Dexterous Manipulation
- [2023] Diffusion Policy: Visuomotor Policy Learning via Action Diffusion
- [2026] Dreamitate: Real-World Visuomotor Policy Learning via Video Generation (paper CoRL 2024)

### Stanford REAL (Research lab)
Focus: robot learning, foundation models, manipulation

- [2024] OpenVLA: An Open-Source Vision-Language-Action Model
- [2023] Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware

### Berkeley RAIL (Research lab)
Focus: robot learning, manipulation, reinforcement learning

- [2025] DexterityGen: Foundation Controller for Unprecedented Dexterity
- [2023] BridgeData V2: A Dataset for Robot Learning at Scale

### CMU Robotics Institute (Research lab)
Focus: autonomy, field robotics, manipulation

- [Index] Robotics Institute Publications Archive

### MIT CSAIL Robotics (Research lab)
Focus: robot learning, planning, distributed robotics

- [Index] CSAIL Publications

### ETH Zürich Robotic Systems Lab (Research lab)
Focus: legged robots, locomotion, field autonomy

- [2024] Learning Robust Autonomous Navigation and Locomotion for Wheeled-Legged Robots

### UPenn GRASP Lab (Research lab)
Focus: drones, multi-robot systems, perception

- [Index] Autonomous Micro UAVs

### UZH Robotics and Perception Group (Research lab)
Focus: drones, agile flight, event vision

- [2021] Learning High-Speed Flight in the Wild
- [2025] Learning Quadrotor Control From Visual Features Using Differentiable Simulation
- [2026] Dream to Fly: Model-Based Reinforcement Learning for Vision-Based Drone Flight
- [2026] Learning Agile Quadrotor Flight in the Real World

### Skild AI (Physical AI company)
Focus: omni-bodied policies, locomotion, robot foundation models

- [2025] One Model, Any Scenario: End-to-end Locomotion from Vision
- [2026] S1: In-Context Learning for Robotics
- [2026] Learning by Watching Human Videos

### Figure AI (Physical AI company)
Focus: humanoids, vision-language-action, full-body control

- [2025] Helix: A Vision-Language-Action Model for Generalist Humanoid Control
- [2025] Scaling Helix: A New State of the Art in Humanoid Logistics
- [2025] Project Go-Big: Internet-Scale Humanoid Pretraining and Direct Human-to-Robot Transfer
- [2026] Introducing Helix 02: Full-Body Autonomy

### 1X World Model Lab (Physical AI company)
Focus: world models, humanoids, video-to-action

- [2025] 1X World Model: Evaluating Bits, not Atoms
- [2026] NEO's Hands: An API to the Physical World

### Waymo Research (Research lab)
Focus: autonomy, motion planning, safety

- [Index] Waymo Research Publications
- [2020] VectorNet: Encoding HD Maps and Agent Dynamics from Vectorized Representation

### FieldAI Research Institute (Research lab)
Focus: field robotics, embodied reasoning, cross-platform autonomy

- [2025] Enter the Mind Palace: Long-term Active Embodied Question Answering

### Hugging Face LeRobot (Open research infrastructure)
Focus: open-source robotics, datasets, robot learning

- [2026] LeRobot: An Open-Source Library for End-to-End Robot Learning

### Prime Intellect (Open research infrastructure)
Focus: distributed training, open agents, compute

- [2025] INTELLECT-2: Globally Distributed Reinforcement Learning

## HOW THIS LIST IS USED

- `SUMMARY.md` — numbered per-paper entries (Paper 01-41): title, lab, summary, contribution to industry.
- `lib/curatedLabs.ts` — the same content as typed data with a source link for every entry; the site renders it per paper in the lab view.
- Site industry view — aggregates these paper-level contributions into the area-level capabilities buyers ask about.
- Entries tagged `[Index]` are lab publication or project indexes, not single papers. They have no industry contribution and are excluded from the paper count.