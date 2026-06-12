# ADR-005 — Schedule-first fasting model

**Status:** Accepted
**Date:** 2026-06-12

## Context

Intermittent-fasting apps typically require the user to start/stop a timer manually. Manual start is the friction that kills the habit: forget to tap at 8pm and the day's data is wrong, the streak guilt-trips, the app gets deleted. The owner's real pattern is a 16:8 rhythm with one structural exception (Sunday family lunch after church).

## Decision

The eating window is configured once (`FastingSchedule`: window start/end, target hours, per-day overrides — Sunday is a first-class exception, not a streak-breaker). The app *assumes* the fast began when the window closed; corrections are a single tap. Actual fasts are explicit `FastingSession` rows (`StartedAt`, `TargetHours`, `EndedAt?`) — at most one open session, outcome (`Completed`/`EndedEarly`) derived in the DTO from elapsed vs target, never stored. The schedule only drives suggestions and reminders, which sidesteps modeling eating windows that cross midnight.

## Consequences

- The 6am screen always shows a sensible fast state with zero prior input.
- Ending early is data, not failure — copy stays grace-forward and the streak logic (Sabbath grace, ADR-004) is unaffected by one missed day a week.
- If the owner's schedule changes structurally (e.g. OMAD), only `FastingSchedule` and the suggestion logic change; session history is untouched.
