namespace Shalom.Domain.Entities;

/// <summary>
/// An actual fast (ADR-005). At most one open session (EndedAt is null).
/// The outcome (Completed / EndedEarly) is derived in DTOs from elapsed vs
/// target and is deliberately never stored.
/// </summary>
public class FastingSession
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public int TargetHours { get; set; } = 16;
    public DateTimeOffset? EndedAt { get; set; }
}
