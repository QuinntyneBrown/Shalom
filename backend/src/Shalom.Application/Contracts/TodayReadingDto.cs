namespace Shalom.Application.Contracts;

/// <summary>
/// The reading pillar's slice of <see cref="TodayDto"/>: the current day of
/// the active plan. The current day is the most recent day completed today
/// (so the card shows its done state) or otherwise the first uncompleted day.
/// </summary>
public record TodayReadingDto(
    Guid DayId,
    int DayNumber,
    string PassageReference,
    string YouVersionUrl,
    bool CompletedToday,
    string PlanName,
    int CompletedCount,
    int TotalDays);
