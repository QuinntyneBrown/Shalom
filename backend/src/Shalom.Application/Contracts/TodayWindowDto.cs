namespace Shalom.Application.Contracts;

/// <summary>Today's eating window (local times in the schedule's timezone), already honoring any weekday override.</summary>
public record TodayWindowDto(TimeOnly Start, TimeOnly End);
