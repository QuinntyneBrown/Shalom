namespace Shalom.Application.Contracts;

/// <summary>
/// The schedule-first fasting configuration (ADR-005) plus the computed
/// <paramref name="TodayWindow"/> for the server-derived local day (ADR-004).
/// </summary>
public record FastingScheduleDto(
    TimeOnly EatingWindowStart,
    TimeOnly EatingWindowEnd,
    int TargetFastHours,
    string TimeZoneId,
    IReadOnlyList<FastingOverrideDto> Overrides,
    TodayWindowDto TodayWindow);
