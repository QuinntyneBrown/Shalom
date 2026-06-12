namespace Shalom.Application.Contracts;

/// <summary>Derived streaks (ADR-004: computed at read time, never stored).</summary>
public record TodayStreaksDto(
    int CheckInCurrent,
    int CheckInLongest,
    int ReadingCurrent,
    int ReadingLongest);
