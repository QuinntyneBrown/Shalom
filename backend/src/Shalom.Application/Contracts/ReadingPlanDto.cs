namespace Shalom.Application.Contracts;

/// <summary>The active reading plan with every day and its completion state.</summary>
public record ReadingPlanDto(
    Guid Id,
    string Name,
    DateOnly StartDate,
    bool IsActive,
    int CompletedCount,
    int TotalDays,
    IReadOnlyList<ReadingDayDto> Days);
