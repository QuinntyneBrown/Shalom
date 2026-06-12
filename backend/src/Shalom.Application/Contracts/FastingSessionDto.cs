namespace Shalom.Application.Contracts;

/// <summary>
/// An actual fast (ADR-005). <paramref name="Outcome"/> is derived at read
/// time — "Completed" when elapsed reached the target, "EndedEarly"
/// otherwise, null while the fast is still open. <paramref name="ElapsedHours"/>
/// is UTC math (DST-immune): (EndedAt ?? now) - StartedAt.
/// </summary>
public record FastingSessionDto(
    Guid Id,
    DateTimeOffset StartedAt,
    int TargetHours,
    DateTimeOffset? EndedAt,
    double ElapsedHours,
    string? Outcome);
