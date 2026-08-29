# RANsliceOpt AI

## Live Browser Artifact

[▶ Open RANsliceOpt AI v15.4 — SLA-Safe Multicell PPO Artifact](https://ysrao.github.io/RANSLICEOPT/)

RANsliceOpt AI — Soft RAN Slicing optimization using RL PPO with Multi-Step MDP.

**Current browser version: v15.4**

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
