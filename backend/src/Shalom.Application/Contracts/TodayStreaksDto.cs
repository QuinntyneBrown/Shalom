namespace Shalom.Application.Contracts;

/// <summary>
/// Derived streaks (ADR-004: computed at read time, never stored). Fasting
/// streak days are the local dates completed fasts ENDED on (a 16h fast
/// started Sunday 8pm completes Monday — that's Monday's win); movement days
/// are the local dates workouts started on.
/// </summary>
public record TodayStreaksDto(
    int CheckInCurrent,
    int CheckInLongest,
    int ReadingCurrent,
    int ReadingLongest,
    int FastingCurrent,
    int FastingLongest,
    int MovementCurrent,
    int MovementLongest);
