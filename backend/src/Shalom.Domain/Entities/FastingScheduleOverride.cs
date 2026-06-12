namespace Shalom.Domain.Entities;

/// <summary>
/// Eating-window override for a single weekday, owned by <see cref="FastingSchedule"/>
/// (mapped via OwnsMany in Infrastructure — no key here by design).
/// </summary>
public class FastingScheduleOverride
{
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly EatingWindowStart { get; set; }
    public TimeOnly EatingWindowEnd { get; set; }
}
