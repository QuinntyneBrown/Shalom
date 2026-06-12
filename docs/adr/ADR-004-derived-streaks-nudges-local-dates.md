# ADR-004 — Derived streaks and nudges; server-derived local dates

**Status:** Accepted
**Date:** 2026-06-12

## Context

Streaks (check-ins, fasting, workouts, reading) and connection nudges ("reach out to X") could be stored as tables maintained on every write, or computed at read time. Separately, "which day is it" is ambiguous in a UTC-stored system: after ~8pm in Toronto, UTC is already tomorrow, which is exactly when an evening check-in or fast-start lands.

## Decision

- **Streaks are derived, never stored.** A pure `StreakCalculator` in `Shalom.Application/Common/` takes a set of `DateOnly` values plus today's local date and returns current/longest streak. Single-user data volumes (a few thousand rows/year) make read-time computation trivial.
- **Nudges are derived, no table.** A nudge is `LastContactedOn + ContactCadenceDays <= today` (or never contacted), computed in `GetConnectionNudgesQuery`.
- **All `DateOnly` facts are derived server-side** in `America/Toronto` via `IClock` + a `LocalDay` helper. Clients never send a date for "today" operations (`PUT /api/check-ins/today`, record-contact). Timestamps are stored as UTC `DateTimeOffset`; fast durations are UTC math (DST-immune); streaks compare local dates only.

## Consequences

- No write-time invariants to corrupt; midnight/DST bugs are confined to one helper with unit tests.
- Streak display always agrees with history because it is computed from it.
- A future multi-user Shalom would revisit per-user timezones; `FastingSchedule.TimeZoneId` already carries the value.
