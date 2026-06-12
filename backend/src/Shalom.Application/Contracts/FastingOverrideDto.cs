namespace Shalom.Application.Contracts;

/// <summary>Per-weekday eating-window override (ADR-005: Sunday lunch is a first-class exception).</summary>
public record FastingOverrideDto(
    DayOfWeek DayOfWeek,
    TimeOnly EatingWindowStart,
    TimeOnly EatingWindowEnd);
