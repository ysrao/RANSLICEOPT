# PPO versus DQN for mIoT Random-Access Overload: A Reproducible Comparative Study

RANsliceOpt AI v17 PRACH-only experiment.

## Research question

Can a gNB-side PPO controller manage synchronized mIoT PRACH congestion more effectively than DQN and deterministic gNB overload-control policies under identical held-out access storms?

## Scope

V17 models mIoT random access only. It does not model or reallocate scheduled eMBB, URLLC, or mIoT PRBs. The experiment is inspired by the access-overload problem studied in 3GPP TR 37.868, but it is an aggregate research simulator rather than a standards-conformance implementation.

At each Random Access Opportunity (RAO), eligible devices pass through the controller's ACB gate. Admitted devices select a contention preamble uniformly. A preamble selected by one device succeeds; a preamble selected by two or more devices collides. Colliding devices use randomized backoff and retry until successful or until the configured attempt limit is exhausted. ACB-denied devices wait for a randomized barring interval before becoming eligible again.

## Matched controllers

All controllers receive the same exogenous arrival schedule, preamble resources, device population, retry limits, and held-out seed:

1. No overload control: all eligible devices are admitted.
2. Fixed ACB: admission probability, barring interval, and retry backoff remain fixed.
3. Adaptive deterministic rule: admission is estimated from backlog and preamble capacity; barring and backoff respond to disclosed collision thresholds.
4. DQN: a gNB-side Q-network uses epsilon-greedy exploration, replay memory, and a target network to select a permitted admission, barring, or retry-backoff action.
5. PPO: a gNB-side actor observes aggregate PRACH state and selects a bounded control profile for admission, barring, and retry backoff.

PPO and DQN are trained on the exact same generated sequence of non-evaluation moderate, severe, and extreme storms. They receive the same state, action set, reward, action guard, training-episode count, environment-interaction count, and held-out traffic. DQN reuses replay samples while PPO is on-policy, so the artefact discloses the algorithmic distinction rather than claiming identical optimizer-update counts. The displayed evaluation seed is held out from training.

## Observations, actions, and outcomes

The PPO state contains normalized backlog, new arrivals, recent collision and success ratios, idle-preamble ratio, backlog and arrival trends, oldest-device wait, retry-exhaustion pressure, accumulated failures, mean delay, and current control settings. Its actions include bounded gNB control profiles plus independent admission, barring, and retry-backoff adjustments.

Training penalizes collisions, failures, backlog, waiting pressure, and idle preambles while a backlog remains. It applies a terminal penalty for devices still unfinished at the end of an episode and a one-time reward for clearing the post-storm backlog. These terms align training with the evaluation treatment of unfinished devices and discourage a superficially low-collision policy that never reopens access.

A disclosed gNB capacity guard masks PPO actions whose estimated admitted attempts exceed the current backlog-to-preamble envelope. During recovery, it also masks unnecessarily restrictive admission settings when idle preambles coexist with a backlog and the collision rate is low. The same mask is applied during training and evaluation; it constrains PPO to standards-compatible overload-control settings rather than replacing the learned policy.

Reported outcomes are access success, access failures, collision rate, retries, mean and 95th-percentile access delay, peak backlog, and backlog-clearance RAO. Delay is derived from the configured RAO rate; it is simulated access delay, not measured network latency.

## Acceptance rule

PPO is supported for a held-out test only when, relative to the best deterministic result selected first by failures and then by P95 delay, it:

- causes no more access failures;
- does not reduce access success materially;
- keeps P95 access delay within 5%; and
- improves failures, collision rate, or P95 delay by at least 5%.

A PPO loss or tie is retained and reported. The default settings are exploratory and are not evidence of general superiority. Confirmatory work requires frozen scenarios, independent seeds, confidence intervals, stronger calibrated baselines, and review against the applicable LTE/NR specifications.

The browser artefact also provides a synthetic validation matrix. It evaluates trained PPO and DQN policies on moderate, severe, and extreme profiles over a configurable number of held-out traffic seeds, applies the same acceptance rule to every scenario, and reports direct PPO-versus-DQN win/tie/loss counts with a 95% Wilson interval for PPO's observed head-to-head win rate. Both learning methods use the same disclosed action guard. This interval describes only the configured simulator matrix and is not a confidence statement about practical networks.
