namespace Shalom.Application.Contracts;

/// <summary>
/// A person in the circle. <paramref name="LastContactedOn"/> and
/// <paramref name="SnoozedUntil"/> are the only stored connection facts —
/// whether a nudge is due is always derived at read time (ADR-004).
/// </summary>
public record PersonDto(
    Guid Id,
    string Name,
    string? Relationship,
    string? Phone,
    int? ContactCadenceDays,
    string? Notes,
    DateOnly? LastContactedOn,
    DateOnly? SnoozedUntil);
