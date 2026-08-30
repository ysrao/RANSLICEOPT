# RANsliceOpt v16 experimental disturbance evaluation

## Purpose

This experimental artifact tests whether the existing seven-input PPO controller provides a measurable transient-resilience benefit under a held-out offered-load disturbance. It does not replace the v15.4 reference evaluation and does not claim general PPO superiority.

The disturbance is absent from PPO training. PPO and the deterministic rule controller begin with the same allocation and receive the same evaluation seed and event. The user can select the disturbed slice, offered-load increase from 0% to 500%, start step, duration, and reward non-inferiority tolerance.

## Decision rule

PPO usefulness is supported for a particular disturbance test only when all of the following hold over the disturbance plus ten recovery steps:

1. Rule-based service shortfall is nonzero and PPO reduces it by at least 10%.
2. PPO does not reduce the worst disturbed-slice service value.
3. PPO cumulative reward remains within the disclosed non-inferiority tolerance. The default tolerance is 2.5%.

Service shortfall is the sum of `max(0, 1 - service)` over the transient window. Real URLLC packet latency remains unavailable and is not inferred from modeled service.

## Exploratory sweep

A predefined sweep tested eMBB, URLLC, and mIoT/eMTC disturbances of 50%, 100%, 200%, and 400%, beginning at step 60 and lasting five steps. PPO did not improve eMBB or URLLC resilience. At a 400% mIoT/eMTC disturbance, it produced a large modeled-service improvement with a small reward tradeoff:

| Metric | Rule-based | PPO |
|---|---:|---:|
| Cumulative mIoT service shortfall | 0.4918 | 0.0052 |
| Worst mIoT service | 0.7456 | 0.9957 |
| Cumulative reward | 13.7425 | 13.5701 |
| Reward difference | — | -1.25% |

Under the declared 2.5% reward non-inferiority tolerance, this test supports a conditional PPO resilience benefit. It does not show a higher aggregate reward.

## Timing check

The 400% five-step mIoT/eMTC disturbance was repeated at five held-out start steps:

| Start step | Rule shortfall | PPO shortfall | Rule worst service | PPO worst service | PPO reward difference |
|---:|---:|---:|---:|---:|---:|
| 25 | 0.6135 | 0.0000 | 0.6960 | 1.0022 | +0.49% |
| 40 | 0.4315 | 0.0089 | 0.7703 | 0.9911 | -1.41% |
| 60 | 0.4918 | 0.0052 | 0.7456 | 0.9957 | -1.25% |
| 80 | 0.3423 | 0.0008 | 0.7347 | 0.9992 | -1.78% |
| 100 | 0.4364 | 0.0080 | 0.5636 | 0.9920 | -2.00% |

The modeled shortfall improvement is consistent across these timings. The result is still exploratory because the same traffic generator and one evaluation seed are used.

## Interpretation

The evidence supports a narrow claim: under the tested severe mIoT access-storm abstraction, PPO preserved mIoT service substantially better than the rule controller while keeping cumulative reward within 2.5%. PPO did not demonstrate usefulness for the tested eMBB or URLLC disturbances. The result should be validated across independent seeds and traffic generators before inclusion as confirmatory evidence in the IEEE paper.

Artifact: `RANsliceOpt_AI_v16_experimental.html`
