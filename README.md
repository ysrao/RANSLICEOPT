# RANsliceOpt AI

## Live Browser Artifact

[▶ Open RANsliceOpt AI v15.3 — Full Multicell PPO Artifact](https://ysrao.github.io/RANSLICEOPT/)

RANsliceOpt AI — Soft RAN Slicing optimization using RL PPO with Multi-Step MDP.

**Current browser version: v15.3**

## Multicell Configuration Artifact — v15.3

The full root artifact now models a fixed 10-site cluster while retaining PPO training, rule-baseline evaluation, diagnostics, charts, and trace output. It accepts site-specific X/Y locations and active UE counts, derives non-overlapping service areas from the site layout, and represents mIoT/eMTC demand using registered-device density, access activity, and retry amplification. mIoT SLA selection uses best-effort, managed-target, or contractual-target profiles; managed values are engineering thresholds rather than universal carrier SLAs. eMBB capacity combines its primary FDD allocation with supplemental FDD and effective TDD downlink PRBs, while URLLC and mIoT/eMTC remain single-carrier.
