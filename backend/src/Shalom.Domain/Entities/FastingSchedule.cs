namespace Shalom.Domain.Entities;

/// <summary>
/// Schedule-first fasting configuration (ADR-005): the eating window is set
/// once and the app assumes the fast began when the window closed.
/// </summary>
public class FastingSchedule
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public TimeOnly EatingWindowStart { get; set; }
    public TimeOnly EatingWindowEnd { get; set; }
    public int TargetFastHours { get; set; } = 16;

    /// <summary>IANA id, e.g. "America/Toronto" (ADR-004 carries the value for a future multi-user Shalom).</summary>
    public string TimeZoneId { get; set; } = "America/Toronto";

    /// <summary>
    /// Per-weekday eating-window overrides (ADR-005: Sunday family lunch is a
    /// first-class exception, not a streak-breaker). Modeled as a small owned
    /// collection rather than fourteen nullable per-weekday columns: EF maps
    /// it cleanly to a child table keyed by the schedule, and a weekday with
    /// no row simply uses the default window.
    /// </summary>
    public List<FastingScheduleOverride> Overrides { get; set; } = new();
}
