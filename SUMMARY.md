# Physical Atlas — Per-Paper Summary & Industry Contribution

_Last updated 18 September 2026. One entry per curated paper, in the same order as `lib/curatedLabs.ts`._

**Format.** Each numbered entry covers the same paper end to end: **Title · Lab · Year · Summary** (what the paper itself does and shows) and then **Contribution to industry** (what that same paper changed in products, deployments, tooling or datasets). Entries 01-41 are individual papers.

**Not papers.** Five links in the curated map are lab publication indexes rather than single papers. They are listed separately at the end, are not numbered, and carry a scope description instead of an industry contribution.

**Sourcing.** Every summary and industry note is written from the paper's own abstract, technical report or official project page, linked in each entry and in `lib/curatedLabs.ts`. Where an item is a company or lab claim rather than a peer-reviewed result, the entry says so. The 2026 Isaac Sim entry is an independent survey rather than an NVIDIA publication and is flagged in place.

**Contents**

| # | Paper | Lab |
|---|---|---|
| 01 | AutoRT: Embodied Foundation Models for Large Scale Orchestration | Google DeepMind Robotics |
| 02 | RoboCat: A Self-Improving Foundation Agent for Robotic Manipulation | Google DeepMind Robotics |
| 03 | RT-1: Robotics Transformer for Real-World Control at Scale | Google DeepMind Robotics |
| 04 | RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control | Google DeepMind Robotics |
| 05 | Open X-Embodiment: Robotic Learning Datasets and RT-X Models | Google DeepMind Robotics |
| 06 | Do As I Can, Not As I Say: Grounding Language in Robotic Affordances | Google Research |
| 07 | π0: A Vision-Language-Action Flow Model for General Robot Control | Physical Intelligence |
| 08 | FAST: Efficient Robot Action Tokenization | Physical Intelligence |
| 09 | Teaching Robots to Listen and Think Harder (Hi Robot) | Physical Intelligence |
| 10 | Emergence of Human to Robot Transfer in VLAs | Physical Intelligence |
| 11 | VLAs that Train Fast, Run Fast, and Generalize Better (knowledge insulation) | Physical Intelligence |
| 12 | VLAs with Long and Short-Term Memory (MEM) | Physical Intelligence |
| 13 | Real-Time Action Chunking with Large Models (RTC) | Physical Intelligence |
| 14 | Precise Manipulation with Efficient Online RL (RLT) | Physical Intelligence |
| 15 | Isaac Lab: A GPU-Accelerated Simulation Framework for Multi-Modal Robot Learning | NVIDIA Robotics Research |
| 16 | NVIDIA Isaac Sim: Enabling Scalable, GPU-Accelerated Simulation for Robotics (independent survey) | NVIDIA Robotics Research |
| 17 | A Careful Examination of Large Behavior Models for Multitask Dexterous Manipulation | Toyota Research Institute Robotics |
| 18 | Diffusion Policy: Visuomotor Policy Learning via Action Diffusion | Toyota Research Institute Robotics |
| 19 | Dreamitate: Real-World Visuomotor Policy Learning via Video Generation | Toyota Research Institute Robotics |
| 20 | OpenVLA: An Open-Source Vision-Language-Action Model | Stanford REAL |
| 21 | Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware (ALOHA/ACT) | Stanford REAL |
| 22 | DexterityGen: Foundation Controller for Unprecedented Dexterity | Berkeley RAIL |
| 23 | BridgeData V2: A Dataset for Robot Learning at Scale | Berkeley RAIL |
| 24 | Learning Robust Autonomous Navigation and Locomotion for Wheeled-Legged Robots | ETH Zürich Robotic Systems Lab |
| 25 | Learning High-Speed Flight in the Wild | UZH Robotics and Perception Group |
| 26 | Learning Quadrotor Control From Visual Features Using Differentiable Simulation | UZH Robotics and Perception Group |
| 27 | Dream to Fly: Model-Based Reinforcement Learning for Vision-Based Drone Flight | UZH Robotics and Perception Group |
| 28 | Learning Agile Quadrotor Flight in the Real World | UZH Robotics and Perception Group |
| 29 | One Model, Any Scenario: End-to-end Locomotion from Vision | Skild AI |
| 30 | S1: In-Context Learning for Robotics | Skild AI |
| 31 | Learning by Watching Human Videos | Skild AI |
| 32 | Helix: A Vision-Language-Action Model for Generalist Humanoid Control | Figure AI |
| 33 | Scaling Helix: A New State of the Art in Humanoid Logistics | Figure AI |
| 34 | Project Go-Big: Internet-Scale Humanoid Pretraining and Direct Human-to-Robot Transfer | Figure AI |
| 35 | Introducing Helix 02: Full-Body Autonomy | Figure AI |
| 36 | 1X World Model: Evaluating Bits, not Atoms | 1X World Model Lab |
| 37 | NEO's Hands: An API to the Physical World | 1X World Model Lab |
| 38 | VectorNet: Encoding HD Maps and Agent Dynamics from Vectorized Representation | Waymo Research |
| 39 | Enter the Mind Palace: Long-term Active Embodied Question Answering | FieldAI Research Institute |
| 40 | LeRobot: An Open-Source Library for End-to-End Robot Learning | Hugging Face LeRobot |
| 41 | INTELLECT-2: Globally Distributed Reinforcement Learning | Prime Intellect |

## Per-paper summaries and industry contributions

## Google DeepMind Robotics (Research lab)

### Paper 01 · AutoRT: Embodied Foundation Models for Large Scale Orchestration
- **Lab:** Google DeepMind Robotics (Research lab) · 2024 · [paper](https://deepmind.google/research/publications/48151/)
- **Summary:** Uses an LLM to propose diverse tasks for fleets of mobile manipulators, filters every proposal through a safety layer, and collects the resulting real-world demonstrations in offices with minimal human supervision.
- **Contribution to industry:** Established the fleet-scale, LLM-directed collection loop and safety filtering pattern industry now uses to gather large robot datasets without scripting each task by hand.

### Paper 02 · RoboCat: A Self-Improving Foundation Agent for Robotic Manipulation
- **Lab:** Google DeepMind Robotics (Research lab) · 2023 · [paper](https://deepmind.google/research/publications/35829/)
- **Summary:** A generalist agent that adapts to new tasks and new robot embodiments from roughly 100 demonstrations, then generates its own training data to improve across successive tasks.
- **Contribution to industry:** Showed self-generated data can compound robot skill learning, the basis for the self-improvement loops robot-model teams now use to cut cost per new task.

### Paper 03 · RT-1: Robotics Transformer for Real-World Control at Scale
- **Lab:** Google DeepMind Robotics (Research lab) · 2022 · [paper](https://arxiv.org/abs/2212.06817)
- **Summary:** A transformer policy trained on about 130,000 real robot episodes that maps camera images and natural-language instructions to discretized actions across hundreds of tasks at high control rates.
- **Contribution to industry:** The first widely replicated evidence that one large policy can replace per-task controllers, making it the architectural baseline for today's robot-learning stacks.

### Paper 04 · RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control
- **Lab:** Google DeepMind Robotics (Research lab) · 2023 · [paper](https://arxiv.org/abs/2307.15818)
- **Summary:** Co-fine-tunes a web-scale vision-language model on robot trajectories so the resulting vision-language-action model inherits internet knowledge and generalizes to unseen objects and instructions.
- **Contribution to industry:** Proved web pretraining transfers to physical control, which is why almost every commercial robot foundation model now starts from a pretrained VLM.

### Paper 05 · Open X-Embodiment: Robotic Learning Datasets and RT-X Models
- **Lab:** Google DeepMind Robotics (Research lab) · 2023 · [paper](https://arxiv.org/abs/2310.08864)
- **Summary:** Assembles more than one million trajectories from 22 robot embodiments into a single dataset and shows RT-X policies trained across them gain positive transfer.
- **Contribution to industry:** Gave industry a shared multi-robot corpus plus evidence that cross-embodiment data helps, shaping how teams now mix data across heterogeneous robot fleets.

## Google Research (Research lab)

### Paper 06 · Do As I Can, Not As I Say: Grounding Language in Robotic Affordances
- **Lab:** Google Research (Research lab) · 2022 · [paper](https://arxiv.org/abs/2204.01691)
- **Summary:** Grounds large language model plans in a robot's learned affordances so the model proposes steps and the robot scores and executes only the ones it can actually do, replanning when a step fails.
- **Contribution to industry:** Established the "LLM reasons, robot filters" pattern industry uses to turn natural-language instructions into safe, executable robot actions on factory and service floors.

## Physical Intelligence (Physical AI company)

### Paper 07 · π0: A Vision-Language-Action Flow Model for General Robot Control
- **Lab:** Physical Intelligence (Physical AI company) · 2024 · [project](https://www.pi.website/blog/pi0)
- **Summary:** A roughly 3B-parameter vision-language-action model that adds a flow-matching action expert to a pretrained VLM and is fine-tuned to dexterous multi-robot tasks such as laundry folding and table bussing.
- **Contribution to industry:** Introduced flow-matching action generation and became a licensable generalist robot brain that other companies adapt to their own hardware and task suites.

### Paper 08 · FAST: Efficient Robot Action Tokenization
- **Lab:** Physical Intelligence (Physical AI company) · 2024 · [project](https://www.pi.website/research/fast)
- **Summary:** Compresses continuous robot action chunks with a frequency-domain tokenizer so vision-language-action models can be trained autoregressively at high speed without losing dexterity.
- **Contribution to industry:** Cut VLA training time and cost by roughly an order of magnitude, making fast action tokenization a standard ingredient in commercial robot models.

### Paper 09 · Teaching Robots to Listen and Think Harder (Hi Robot)
- **Lab:** Physical Intelligence (Physical AI company) · 2025 · [project](https://www.pi.website/research/hirobot)
- **Summary:** A two-level system: a high-level VLM breaks complex prompts and live corrections into single steps "whispered" to the π0 low-level policy, trained partly on synthetically labelled interactions. It reports about 76% instruction-following accuracy versus 36% for a flat VLA and 30% for a GPT-4o high-level baseline.
- **Contribution to industry:** Laid out the recipe for conversational robot assistants that handle multi-stage requests and mid-task human corrections, the interaction model service and retail robots now ship with.

### Paper 10 · Emergence of Human to Robot Transfer in VLAs
- **Lab:** Physical Intelligence (Physical AI company) · 2025 · [project](https://www.pi.website/research/human_to_robot)
- **Summary:** Shows that simply co-fine-tuning a scaled VLA on egocentric human video transfers to robot behavior, and that this ability emerges as robot pretraining data grows, giving up to 2x improvement where robot data is scarce.
- **Contribution to industry:** Turns cheap wearable human video into a usable industrial data source, shrinking how much expensive robot teleoperation a deployment needs to cover a new task.

### Paper 11 · VLAs that Train Fast, Run Fast, and Generalize Better (knowledge insulation)
- **Lab:** Physical Intelligence (Physical AI company) · 2025 · [project](https://www.pi.website/research/knowledge_insulation)
- **Summary:** Knowledge insulation stops gradients from newly added continuous action experts from overwriting the VLM backbone, so the model trains as fast as tokenized VLAs while keeping web-scale semantic knowledge.
- **Contribution to industry:** Gives robot teams faster VLA training plus better language following in unseen environments, a direct cost and reliability win for deployed manipulation.

### Paper 12 · VLAs with Long and Short-Term Memory (MEM)
- **Lab:** Physical Intelligence (Physical AI company) · 2026 · [project](https://www.pi.website/research/memory)
- **Summary:** Multi-scale Embodied Memory keeps short-horizon video history and long-horizon language summaries that the model chooses to store, enabling tasks up to 15 minutes long and in-context recovery from earlier mistakes.
- **Contribution to industry:** Lifts the short-task ceiling on robot policies, a prerequisite for commercial cleaning, service and kitchen jobs that run for many minutes without resets.

### Paper 13 · Real-Time Action Chunking with Large Models (RTC)
- **Lab:** Physical Intelligence (Physical AI company) · 2025 · [project](https://www.pi.website/research/real_time_chunking)
- **Summary:** Real-time chunking lets diffusion- and flow-based VLAs generate the next action chunk while the previous one is still executing, with no training-time changes and without the discontinuities that break naive smoothing. Throughput stays flat even with 200 ms of injected latency, where temporal ensembling fails outright.
- **Contribution to industry:** Allows remote or on-robot VLA inference with 100-300 ms of latency while keeping industrial cycle times intact as models keep growing.

### Paper 14 · Precise Manipulation with Efficient Online RL (RLT)
- **Lab:** Physical Intelligence (Physical AI company) · 2026 · [project](https://www.pi.website/research/rlt)
- **Summary:** RL tokens summarize the VLA's internal state into a compact interface, letting a tiny on-robot actor-critic learn online and speed up the most precise phases of tasks by up to 3x from about 15 minutes of real data, in some cases beating human teleoperation speed.
- **Contribution to industry:** Lets deployed robots improve the last millimetre of precision tasks on the line or jobsite instead of shipping hardware back to a research lab.

## NVIDIA Robotics Research (Research lab)

### Paper 15 · Isaac Lab: A GPU-Accelerated Simulation Framework for Multi-Modal Robot Learning
- **Lab:** NVIDIA Robotics Research (Research lab) · 2025 · [paper](https://arxiv.org/abs/2511.04831)
- **Summary:** NVIDIA's successor to Isaac Gym: GPU-parallel physics, photorealistic rendering, actuator and multi-frequency sensor models, data collection and domain randomization unified in one composable framework for reinforcement and imitation learning at scale.
- **Contribution to industry:** Became the de-facto training substrate for robot learning, letting teams train whole-body, locomotion and dexterous policies in hours of wall-clock instead of weeks.

### Paper 16 · NVIDIA Isaac Sim: Enabling Scalable, GPU-Accelerated Simulation for Robotics
- **Lab:** listed under NVIDIA Robotics Research (Research lab) · 2026 · [paper](https://arxiv.org/abs/2606.03551) · **independent survey, not an NVIDIA publication**
- **Summary:** An independent survey by external (UNSW) authors: it reviews Isaac Sim's architecture, compares it with other simulators, and analyses representative usage across five domains plus practical limits.
- **Contribution to industry:** Gives engineering teams an evidence-based map of where GPU simulation pays off, shortening simulator and digital-twin decisions before hardware investment.

## Toyota Research Institute Robotics (Research lab)

### Paper 17 · A Careful Examination of Large Behavior Models for Multitask Dexterous Manipulation
- **Lab:** Toyota Research Institute Robotics (Research lab) · 2025 · [paper](https://doi.org/10.48550/arXiv.2507.05331)
- **Summary:** Extends Diffusion Policy into multitask Large Behavior Models and evaluates them through blind, randomized simulation and real-world trials, finding that multitask pretraining improves success, robustness and data efficiency.
- **Contribution to industry:** Replaced demo-video evidence with blinded randomized trials as the bar for trusting robot foundation models, giving buyers a defensible method for evaluating them.

### Paper 18 · Diffusion Policy: Visuomotor Policy Learning via Action Diffusion
- **Lab:** Toyota Research Institute Robotics (Research lab) · 2023 · [paper](https://arxiv.org/abs/2303.04137)
- **Summary:** Represents a visuomotor policy as a denoising diffusion process over action sequences conditioned on observations, handling multimodal demonstrations and high-frequency control.
- **Contribution to industry:** Became a default imitation-learning algorithm in both commercial manipulation stacks and open-source robot-learning libraries.

### Paper 19 · Dreamitate: Real-World Visuomotor Policy Learning via Video Generation
- **Lab:** Toyota Research Institute Robotics (Research lab) · lab page 2026, paper CoRL 2024 · [lab page](https://www.tri.global/research/dreamitate-real-world-visuomotor-policy-learning-video-generation) · [paper](https://arxiv.org/abs/2406.16862)
- **Summary:** Fine-tunes a video diffusion model on human demonstrations, generates an imagined execution conditioned on images of a novel scene, and uses that video directly to control the robot, with common tools bridging the human-to-robot embodiment gap.
- **Contribution to industry:** Showed internet-scale video generators can serve as policy engines, cutting the demonstrations needed to deploy a known task in a new environment.

## Stanford REAL (Research lab)

### Paper 20 · OpenVLA: An Open-Source Vision-Language-Action Model
- **Lab:** Stanford REAL (Research lab) · 2024 · [paper](https://arxiv.org/abs/2406.09246)
- **Summary:** A 7B open-weight vision-language-action model trained on about 970,000 robot episodes from Open X-Embodiment, fine-tunable to new tasks and embodiments with modest compute.
- **Contribution to industry:** Gave industry and academia an affordable, inspectable alternative to proprietary robot models, with fine-tuning feasible on consumer GPUs.

### Paper 21 · Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware (ALOHA/ACT)
- **Lab:** Stanford REAL (Research lab) · 2023 · [paper](https://arxiv.org/abs/2304.13705)
- **Summary:** Presents ALOHA, a low-cost bimanual teleoperation rig, plus Action Chunking with Transformers, which learns fine-grained tasks such as threading, slotting and opening translucent objects.
- **Contribution to industry:** The hardware design and ACT algorithm were widely copied, letting small teams and startups collect high-quality manipulation data without six-figure robot arms.

## Berkeley RAIL (Research lab)

### Paper 22 · DexterityGen: Foundation Controller for Unprecedented Dexterity
- **Lab:** Berkeley RAIL (Research lab) · 2025 · [paper](https://arxiv.org/abs/2502.04307)
- **Summary:** Pretrains large-scale dexterous motion primitives with sim-to-real reinforcement learning, distills them into a foundation controller, and uses human teleoperation only as a coarse prompt at run time, improving hold stability 10-100x and enabling pen, syringe and screwdriver use.
- **Contribution to industry:** Moves tool use and long-duration in-hand manipulation within reach of robot vendors targeting assembly, lab and service work that needs human-grade hands.

### Paper 23 · BridgeData V2: A Dataset for Robot Learning at Scale
- **Lab:** Berkeley RAIL (Research lab) · 2023 · [paper](https://arxiv.org/abs/2308.12952)
- **Summary:** An open dataset of roughly 60,000 multi-task, multi-environment manipulation trajectories spanning kitchens, toys, sinks and diverse objects and scenes.
- **Contribution to industry:** Became one of the most-used open manipulation datasets for pretraining policies and for benchmarking generalization across environments.

## ETH Zürich Robotic Systems Lab (Research lab)

### Paper 24 · Learning Robust Autonomous Navigation and Locomotion for Wheeled-Legged Robots
- **Lab:** ETH Zürich Robotic Systems Lab (Research lab) · 2024 · [paper](https://arxiv.org/abs/2405.01792)
- **Summary:** Learns a combined navigation and locomotion stack for wheeled-legged robots that autonomously traverses stairs, ramps, rubble and urban terrain using onboard vision and proprioception.
- **Contribution to industry:** Makes wheeled-legged platforms credible for last-mile delivery, inspection and disaster response, where mixed terrain defeats wheeled-only and legged-only designs.

## UZH Robotics and Perception Group (Research lab)

### Paper 25 · Learning High-Speed Flight in the Wild
- **Lab:** UZH Robotics and Perception Group (Research lab) · 2021 · [paper](https://rpg.ifi.uzh.ch/docs/Loquercio21_Science.pdf)
- **Summary:** Trains a vision-based policy that flies a quadrotor at high speed through cluttered forest trails using onboard sensing only, with no map and no external motion capture.
- **Contribution to industry:** Showed onboard end-to-end learning can replace map-and-plan pipelines for drones, the basis of much of today's autonomous inspection and defence drone autonomy.

### Paper 26 · Learning Quadrotor Control From Visual Features Using Differentiable Simulation
- **Lab:** UZH Robotics and Perception Group (Research lab) · 2025 (ICRA) · [paper](https://arxiv.org/abs/2410.15979)
- **Summary:** Back-propagates gradients through a differentiable simulator to train quadrotor controllers, learning recovery policies in seconds from vehicle state and in minutes from visual features only.
- **Contribution to industry:** Demonstrates that gradient-based simulation training can cut RL sample cost by orders of magnitude for drones and other real-time control products.

### Paper 27 · Dream to Fly: Model-Based Reinforcement Learning for Vision-Based Drone Flight
- **Lab:** UZH Robotics and Perception Group (Research lab) · 2026 (ICRA) · [paper](https://arxiv.org/abs/2501.14377)
- **Summary:** Uses DreamerV3 model-based RL to learn pixel-to-command drone racing policies, emerging with camera-pointing behaviour that keeps gates in view, and flying real hardware up to 9 m/s.
- **Contribution to industry:** Positions model-based RL as a practical route to agile autonomy for teams whose data and compute budgets are far smaller than model-free methods require.

### Paper 28 · Learning Agile Quadrotor Flight in the Real World
- **Lab:** UZH Robotics and Perception Group (Research lab) · 2026 (RSS) · [paper](https://arxiv.org/abs/2602.10111)
- **Summary:** Removes the need for precise system identification or offline sim-to-real transfer: adaptive temporal scaling explores the platform's physical limits while online residual learning and in-flight policy updates raise a conservative 1.9 m/s policy to 7.3 m/s in about 100 seconds of flight.
- **Contribution to industry:** Replaces fragile identification pipelines with in-flight adaptation, letting drone vendors keep improving aggressive flight performance after deployment.

## Skild AI (Physical AI company)

### Paper 29 · One Model, Any Scenario: End-to-end Locomotion from Vision
- **Lab:** Skild AI (Physical AI company) · 2025 · [technical post](https://www.skild.ai/blogs/one-policy-all-scenarios)
- **Summary:** A hierarchical vision-driven policy whose low-level network turns raw images and joint feedback directly into motor commands, so one model walks, climbs stairs and steps over obstacles with no mapping, planning or behaviour switching. Tested on unseen city parks, fire escapes and obstacle courses.
- **Contribution to industry:** Shows one learned controller can replace terrain-specific locomotion software, which is what lets robot vendors sell a general-purpose machine rather than a site-specific one.

### Paper 30 · S1: In-Context Learning for Robotics
- **Lab:** Skild AI (Physical AI company) · 2026 · [technical post](https://www.skild.ai/blogs/s1)
- **Summary:** A manipulation foundation model built for in-context learning: a single video prompt specifies a task, including unseen tasks over roughly 10-minute horizons, with no weight updates, reaching about 96% accuracy on seen tasks. The post is a first-party report of the company's own results.
- **Contribution to industry:** Removes per-task data collection and fine-tuning from robot deployment; the company reports S1 is already deployed with commercial partners.

### Paper 31 · Learning by Watching Human Videos
- **Lab:** Skild AI (Physical AI company) · 2026 · [technical post](https://www.skild.ai/blogs/learning-by-watching)
- **Summary:** Finetunes the omni-bodied model on human video — egocentric footage and instructional video — with under an hour of robot data to acquire new skills, tackling the diversity and scale limits of teleoperation.
- **Contribution to industry:** Frames internet-scale human video as the robot data flywheel, potentially relieving the teleoperation bottleneck that caps how fast the whole industry can add skills.

## Figure AI (Physical AI company)

### Paper 32 · Helix: A Vision-Language-Action Model for Generalist Humanoid Control
- **Lab:** Figure AI (Physical AI company) · 2025 · [technical report](https://www.figure.ai/news/helix)
- **Summary:** A single VLA that controls the humanoid's upper body from pixels using a dual-rate system: fast visuomotor reflexes at high frequency plus a slower reasoning VLM, all running on onboard hardware.
- **Contribution to industry:** One of the first humanoid VLAs running onboard in commercial pilots, showing generalist humanoid control can live on consumer-grade compute.

### Paper 33 · Scaling Helix: A New State of the Art in Humanoid Logistics
- **Lab:** Figure AI (Physical AI company) · 2025 · [technical report](https://www.figure.ai/news/scaling-helix-logistics)
- **Summary:** Adds vision memory, state history and force feedback and scales demonstrations from 10 to 60 hours, handling poly bags and envelopes at about 4.05 s per package with roughly 95% barcode-scan success on a live conveyor.
- **Contribution to industry:** Benchmarked learned humanoid manipulation against human speed and reliability inside a real distribution centre, the evidence logistics buyers require before ordering fleets.

### Paper 34 · Project Go-Big: Internet-Scale Humanoid Pretraining and Direct Human-to-Robot Transfer
- **Lab:** Figure AI (Physical AI company) · 2025 · [technical report](https://www.figure.ai/news/project-go-big)
- **Summary:** Builds an internet-scale humanoid pretraining dataset through a Brookfield partnership covering over 100,000 residential units, and shows zero-shot transfer from 100% egocentric human video to language-driven robot navigation with no robot demonstrations.
- **Contribution to industry:** Establishes large human-video data partnerships across homes and commercial real estate as the strategy for humanoid pretraining.

### Paper 35 · Introducing Helix 02: Full-Body Autonomy
- **Lab:** Figure AI (Physical AI company) · 2026 · [technical report](https://www.figure.ai/news/helix-02)
- **Summary:** Extends Helix to the whole body with a learned System 0 controller trained on over 1,000 hours of human motion, completing a continuous 4-minute, 61-action dishwasher task with walking, manipulation and balance and no resets.
- **Contribution to industry:** Replaced 109,504 lines of hand-engineered whole-body C++ control with a neural prior and added tactile and palm-camera dexterity such as single-pill extraction and 5 ml syringe dosing.

## 1X World Model Lab (Physical AI company)

### Paper 36 · 1X World Model: Evaluating Bits, not Atoms
- **Lab:** 1X World Model Lab (Physical AI company) · 2025 · [technical report](https://www.1x.tech/1x-world-model.pdf)
- **Summary:** Trains a video-generation world model on humanoid data and evaluates policies inside it — "evaluating bits, not atoms" — to predict real-world task success before any hardware runs.
- **Contribution to industry:** Lets teams screen humanoid policies against rare and hazardous situations without risking hardware, cutting the cost and time of physical evaluation.

### Paper 37 · NEO's Hands: An API to the Physical World
- **Lab:** 1X World Model Lab (Physical AI company) · 2026 · [technical report](https://www.1x.tech/discover/neos-hands)
- **Summary:** A 25 degree-of-freedom tendon-driven hand with force transparency, tactile skin, low distal inertia and reflex-level robustness, built as the sensing and actuation layer for the NEO humanoid.
- **Contribution to industry:** Treats the hand as the platform API for third-party robot applications and, with 10,000 units planned for the year, targets the hardware ceiling on what humanoid developers can build.

## Waymo Research (Research lab)

### Paper 38 · VectorNet: Encoding HD Maps and Agent Dynamics from Vectorized Representation
- **Lab:** Waymo Research (Research lab) · 2020 · [paper](https://arxiv.org/abs/2005.04259)
- **Summary:** Encodes HD map elements and agent trajectories as vectorized graph nodes processed by a graph neural network, replacing rasterized image stacks for motion prediction.
- **Contribution to industry:** Became a standard trajectory-prediction representation in autonomous driving and mobile robotics stacks, cutting compute while improving prediction accuracy.

## FieldAI Research Institute (Research lab)

### Paper 39 · Enter the Mind Palace: Long-term Active Embodied Question Answering
- **Lab:** FieldAI Research Institute (Research lab) · 2025 · [paper](https://arxiv.org/abs/2507.12846)
- **Summary:** Defines long-term active embodied question answering and solves it with a scene-graph "mind palace" memory plus value-of-information stopping, so the agent decides when to recall, when to explore and when to answer.
- **Contribution to industry:** Gives inspection and field robots a persistent, queryable memory of sites they patrol over days and weeks — a requirement for industrial facility autonomy.

## Hugging Face LeRobot (Open research infrastructure)

### Paper 40 · LeRobot: An Open-Source Library for End-to-End Robot Learning
- **Lab:** Hugging Face LeRobot (Open research infrastructure) · 2026 · [paper](https://arxiv.org/abs/2602.22818)
- **Summary:** An open library spanning the whole robot learning stack: low-level motor middleware, large-scale dataset collection, storage and streaming, state-of-the-art imitation and RL algorithms, and asynchronous inference on accessible hardware.
- **Contribution to industry:** Standardized open infrastructure that lets startups and factories build custom robot skills without proprietary pipelines or six-figure platforms.

## Prime Intellect (Open research infrastructure)

### Paper 41 · INTELLECT-2: Globally Distributed Reinforcement Learning
- **Lab:** Prime Intellect (Open research infrastructure) · 2025 · [technical report](https://www.primeintellect.ai/blog/intellect-2)
- **Summary:** Trains a 32B reasoning model with reinforcement learning across globally distributed, permissionless compute using open communication and training tooling. Adjacent to Physical AI: the evidence is AI training rather than physical-system research.
- **Contribution to industry:** Shows decentralized RL training of large models is practical — an adjacent enabler for robotics teams that need cheap, scattered compute rather than a single large cluster.

## Source indexes (not single papers)

These five curated links are lab publication or project indexes. They carry a scope description, not a paper summary or an industry contribution, and are deliberately not numbered.

- **PaLM-SayCan project page** — Google Research · [link](https://sites.research.google/palm-saycan) — official project page collecting the SayCan papers, videos and Everyday Robots demonstrations that grounded language-model planning in real robot affordances.
- **Robotics Institute Publications Archive** — CMU Robotics Institute · [link](https://publications.ri.cmu.edu/) — official publication archive covering the institute's autonomy, field robotics, manipulation and robot-learning groups.
- **CSAIL Publications** — MIT CSAIL Robotics · [link](https://publications.csail.mit.edu/) — official publication index covering its robot learning, planning and distributed robotics groups.
- **Autonomous Micro UAVs** — UPenn GRASP Lab · [link](https://www.grasp.upenn.edu/projects/autonomous-micro-uavs/) — project page for the lab's research programme in autonomous micro aerial vehicles and multi-drone swarms.
- **Waymo Research Publications** — Waymo Research · [link](https://waymo.com/research/) — official research archive of safety, planning, perception and simulation publications from a deployed autonomous driving programme.

## Appendix — Thematic Synthesis (DeepSeek-V4-Flash, 24-paper snapshot)

_Retained from the earlier summary pass: `deepseek-ai/DeepSeek-V4-Flash` (via the `gmi` model navigator) over an earlier 24-paper snapshot of the curated map. It is kept as a cross-paper view; the numbered per-paper entries above supersede it for counts and for any paper added since._

### Thematic Synthesis of Physical AI Research (24 Papers)

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
