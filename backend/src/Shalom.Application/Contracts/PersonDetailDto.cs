namespace Shalom.Application.Contracts;

/// <summary>One person plus their important dates (with derived daysUntil).</summary>
public record PersonDetailDto(
    Guid Id,
    string Name,
    string? Relationship,
    string? Phone,
    int? ContactCadenceDays,
    string? Notes,
    DateOnly? LastContactedOn,
    DateOnly? SnoozedUntil,
    IReadOnlyList<ImportantDateDto> Dates);
