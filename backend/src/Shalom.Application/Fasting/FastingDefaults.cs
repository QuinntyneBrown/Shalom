using Shalom.Domain.Entities;

namespace Shalom.Application.Fasting;

/// <summary>
/// The schedule the app assumes until the owner says otherwise (ADR-005):
/// 16:8 with a 12:00–20:00 eating window in America/Toronto, plus the Sunday
/// family-lunch override (13:30–20:30) — an exception that is part of the
/// rhythm, not a break. Created lazily on first fasting read; matches the
/// seed data and the .pen design.
/// </summary>
public static class FastingDefaults
{
    public const int TargetFastHours = 16;
    public static readonly TimeOnly EatingWindowStart = new(12, 0);
    public static readonly TimeOnly EatingWindowEnd = new(20, 0);
    public static readonly TimeOnly SundayWindowStart = new(13, 30);
    public static readonly TimeOnly SundayWindowEnd = new(20, 30);

    public static FastingSchedule CreateDefault(Guid userId) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        EatingWindowStart = EatingWindowStart,
        EatingWindowEnd = EatingWindowEnd,
        TargetFastHours = TargetFastHours,
        TimeZoneId = Common.LocalDay.DefaultTimeZoneId,
        Overrides =
        {
            new FastingScheduleOverride
            {
                DayOfWeek = DayOfWeek.Sunday,
                EatingWindowStart = SundayWindowStart,
                EatingWindowEnd = SundayWindowEnd,
            },
        },
    };
}
