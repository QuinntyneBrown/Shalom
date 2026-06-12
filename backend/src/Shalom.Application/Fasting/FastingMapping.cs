using Shalom.Application.Contracts;
using Shalom.Domain.Entities;

namespace Shalom.Application.Fasting;

/// <summary>
/// Entity → DTO mapping for the fasting slice. The outcome lives here and
/// only here (ADR-005: derived in the DTO, never stored): "Completed" when
/// elapsed reached the target, "EndedEarly" otherwise, null while open.
/// Elapsed is pure UTC math, so DST transitions never warp a fast.
/// </summary>
public static class FastingMapping
{
    public const string OutcomeCompleted = "Completed";
    public const string OutcomeEndedEarly = "EndedEarly";

    public static FastingSessionDto ToDto(FastingSession session, DateTimeOffset now)
    {
        var elapsed = (session.EndedAt ?? now) - session.StartedAt;
        var outcome = session.EndedAt is null
            ? null
            : elapsed.TotalHours >= session.TargetHours ? OutcomeCompleted : OutcomeEndedEarly;

        return new FastingSessionDto(
            session.Id,
            session.StartedAt,
            session.TargetHours,
            session.EndedAt,
            Math.Round(elapsed.TotalHours, 2),
            outcome);
    }

    public static FastingScheduleDto ToDto(FastingSchedule schedule, DateOnly today)
    {
        var window = TodayWindowFor(schedule, today);
        return new FastingScheduleDto(
            schedule.EatingWindowStart,
            schedule.EatingWindowEnd,
            schedule.TargetFastHours,
            schedule.TimeZoneId,
            schedule.Overrides
                .OrderBy(o => o.DayOfWeek)
                .Select(o => new FastingOverrideDto(o.DayOfWeek, o.EatingWindowStart, o.EatingWindowEnd))
                .ToList(),
            window);
    }

    /// <summary>Today's eating window, honoring the weekday override when one exists.</summary>
    public static TodayWindowDto TodayWindowFor(FastingSchedule schedule, DateOnly today)
    {
        var @override = schedule.Overrides.FirstOrDefault(o => o.DayOfWeek == today.DayOfWeek);
        return @override is null
            ? new TodayWindowDto(schedule.EatingWindowStart, schedule.EatingWindowEnd)
            : new TodayWindowDto(@override.EatingWindowStart, @override.EatingWindowEnd);
    }
}
