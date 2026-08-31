# RANsliceOpt AI v17 PRACH-only experiment

## Research question

Can a gNB-side PPO controller manage synchronized mIoT PRACH congestion more effectively than deterministic gNB overload-control policies under identical held-out access storms?

## Scope

V17 models mIoT random access only. It does not model or reallocate scheduled eMBB, URLLC, or mIoT PRBs. The experiment is inspired by the access-overload problem studied in 3GPP TR 37.868, but it is an aggregate research simulator rather than a standards-conformance implementation.

At each Random Access Opportunity (RAO), eligible devices pass through the controller's ACB gate. Admitted devices select a contention preamble uniformly. A preamble selected by one device succeeds; a preamble selected by two or more devices collides. Colliding devices use randomized backoff and retry until successful or until the configured attempt limit is exhausted. ACB-denied devices wait for a randomized barring interval before becoming eligible again.

## Matched controllers

All controllers receive the same exogenous arrival schedule, preamble resources, device population, retry limits, and held-out seed:

1. No overload control: all eligible devices are admitted.
2. Fixed ACB: admission probability, barring interval, and retry backoff remain fixed.
3. Adaptive deterministic rule: admission is estimated from backlog and preamble capacity; barring and backoff respond to disclosed collision thresholds.
4. PPO: a gNB-side actor observes aggregate PRACH state and selects a bounded control profile for admission, barring, and retry backoff.

PPO is trained on non-evaluation moderate, severe, and extreme storms. The displayed evaluation seed is held out from training.

## Observations, actions, and outcomes

The PPO state contains normalized backlog, new arrivals, recent collision and success ratios, accumulated failures, mean delay, and current control settings. Its actions are bounded gNB control profiles ranging from emergency throttling to fully open access.

Reported outcomes are access success, access failures, collision rate, retries, mean and 95th-percentile access delay, peak backlog, and backlog-clearance RAO. Delay is derived from the configured RAO rate; it is simulated access delay, not measured network latency.

## Acceptance rule

PPO is supported for a held-out test only when, relative to the best deterministic result selected first by failures and then by P95 delay, it:

- causes no more access failures;
- does not reduce access success materially;
- keeps P95 access delay within 5%; and
- improves failures, collision rate, or P95 delay by at least 5%.

A PPO loss or tie is retained and reported. The default settings are exploratory and are not evidence of general superiority. Confirmatory work requires frozen scenarios, independent seeds, confidence intervals, stronger calibrated baselines, and review against the applicable LTE/NR specifications.
