# RANsliceOpt AI

Soft RAN slicing optimisation using RL (PPO) over a multi-step MDP: browser artifacts, a Python decision platform, papers, specs and decks.

**Live artifact (v15.4):** [▶ ysrao.github.io/RANSLICEOPT](https://ysrao.github.io/RANSLICEOPT/)

## Repository layout

| Folder | Contents |
|---|---|
| `index.html` | Live browser artifact, v15.4 SLA-safe multicell PPO (GitHub Pages root) |
| `artifacts/` | Current standalone browser artifacts: v17 PRACH, v16 experimental, Soft Slice Capacity Simulator |
| `platform/` | Python decision-platform MVP (engine, server, tests, web UI, versions); data in `platform/data/` |
| `papers/` | Papers, each in its own folder with source and PDF |
| `specs/` | PPO/MDP specification (v3, IEEE-synchronised) |
| `decks/` | RANOpt AI / DRL RAN planning slide decks and Q&A prep |
| `archive/` | Superseded versions, templates and release bundles, kept for reference |

The `.html` files left at the top level (other than `index.html`) are redirect stubs. They keep old GitHub Pages links working and forward to the new locations.

## Browser artifacts

| Page | Location |
|---|---|
| [RANsliceOpt AI v15.4 — live](https://ysrao.github.io/RANSLICEOPT/) | `index.html` |
| [v17 — PRACH overload control (PPO vs DQN)](https://ysrao.github.io/RANSLICEOPT/artifacts/v17-prach/RANsliceOpt_AI_v17_PRACH.html) | `artifacts/v17-prach/` |
| [v16 — experimental multicell disturbance](https://ysrao.github.io/RANSLICEOPT/artifacts/v16-experimental/RANsliceOpt_AI_v16_experimental.html) | `artifacts/v16-experimental/` |
| [6G NR Soft Slice Capacity Simulator](https://ysrao.github.io/RANSLICEOPT/artifacts/soft-slice-capacity/Soft_Slice_Capacity_Simulator.html) | `artifacts/soft-slice-capacity/` |
| [Platform web v15.5.3](https://ysrao.github.io/RANSLICEOPT/platform/web/index.html) · [v15.5.2](https://ysrao.github.io/RANSLICEOPT/platform/versions/v15.5.2/index.html) | `platform/` |

## Papers

| Paper | Folder |
|---|---|
| PPO versus DQN for mIoT Random-Access Overload (IEEE, 4-page) | `papers/v17-ppo-dqn-ieee/` |
| RANsliceOpt Traceable AI (IEEE) | `papers/traceable-ai-ieee/` |
| SLA-Constrained Soft RAN Slicing using PPO over a Multi-Step MDP (Quarto/Typst) | `papers/sla-constrained-ppo-typst/` |
| [PPO-Based versus Rule-Based 6G RAN Slice Provisioning](https://ysrao.github.io/RANSLICEOPT/papers/ppo-results/ppo-results.html) | `papers/ppo-results/` |
| RANsliceOpt v15.4 single-cell implementation | `papers/single-cell-v15.4/` |
| Working drafts (technical paper, network slicing paper, PPO contextual paper, RAN slice provisioning) | `papers/drafts/` |

## Running the platform

```sh
cd platform
python3 server.py          # then open http://127.0.0.1:8765
python3 -m unittest -v test_engine.py
```

See [`platform/README.md`](platform/README.md) for details.

## Archive

`archive/` holds everything superseded. Nothing was deleted in the reorganisation.

- `archive/artifacts/`: PPO/MDP v14, v15, v15 FINAL, v15.1 FINAL, v15.2, the old RANOpt page, and the v15.3 multicell app
- `archive/specs/`, `archive/papers/`, `archive/decks/`: earlier versions (spec v1, single-cell v1 PDF, deck v1)
- `archive/bundles/`: release zips for v16 and v17. Each zip contains its own README
- `archive/quarto-template/`, `archive/old-readme/`, `archive/orphaned/`: Quarto starter template, old rendered README, and unused build output or duplicates

The former sister repository `ysrao/RANSOFTSLIcEOPT` contained only the Soft Slice Capacity Simulator. That file is identical to `artifacts/soft-slice-capacity/Soft_Slice_Capacity_Simulator.html`, so RANSLICEOPT is now the single home for this work.

---

## Live Browser Artifact — v15.4

RANsliceOpt AI — Soft RAN Slicing optimization using RL PPO with Multi-Step MDP.

**Current browser version: v15.4**

An experimental v16 companion artefact is also included locally as
[`artifacts/v16-experimental/RANsliceOpt_AI_v16_experimental.html`](artifacts/v16-experimental/RANsliceOpt_AI_v16_experimental.html).
Its default held-out event is a five-step, +400% mIoT/eMTC **PRACH access-storm
abstraction**. It increases aggregate access-attempt load during matched PPO and
rule evaluation; it does not simulate individual preambles, collisions, backoff,
retransmission timers, or the complete 3GPP random-access procedure.

## V17 PRACH Overload-Control Research Artifact

[`artifacts/v17-prach/RANsliceOpt_AI_v17_PRACH.html`](artifacts/v17-prach/RANsliceOpt_AI_v17_PRACH.html) is a separate,
PRACH-only mIoT research simulation. It compares no control, fixed ACB, an
adaptive deterministic gNB rule, DQN, and PPO under an identical
held-out synchronized arrival schedule. The model explicitly represents
contention preambles, collisions, randomized barring/backoff, retries, retry
exhaustion, access failures, backlog, and access delay. It does not reallocate
scheduled slice PRBs and does not claim 3GPP conformance or field performance.
The PPO and DQN paths use the same disclosed gNB capacity/recovery action mask,
so their displayed names omit the shared qualifier.

The PPO path uses a hard SLA safety layer: unsafe actions have zero selection
probability, a feasible resource projection is used when no local action is safe,
and physically infeasible traffic/threshold combinations halt without applying an
SLA-violating PPO allocation.

Real URLLC latency is reported as **UNVERIFIABLE** because the browser artifact
has no MAC-scheduler telemetry. Latency is excluded from the PPO state objective,
reward, action mask, comparison gain, and SLA pass/fail result. PPO protects only
the configurable minimum URLLC PRB envelope; the displayed latency SLA is a
reference value, not an optimization constraint.

PPO deployment also uses a matched rule-baseline acceptance gate. The PPO
candidate is published only when at least one controllable tail-average KPI
improves and none of eMBB throughput, mIoT service, fairness, controllable
efficiency, or composite reward degrades. A rejected candidate is labeled
`REJECTED`; its values are not substituted, clipped, or presented as gains.

## Multicell Configuration Artifact — v15.4

The full root artifact now models a fixed 10-site cluster while retaining PPO training, rule-baseline evaluation, diagnostics, charts, and trace output. It accepts site-specific X/Y locations and active UE counts, derives non-overlapping service areas from the site layout, and represents mIoT/eMTC demand using registered-device density, access activity, and retry amplification. mIoT SLA selection uses best-effort, managed-target, or contractual-target profiles; managed values are engineering thresholds rather than universal carrier SLAs. eMBB capacity combines its primary FDD allocation with supplemental FDD and effective TDD downlink PRBs, while URLLC and mIoT/eMTC remain single-carrier.
