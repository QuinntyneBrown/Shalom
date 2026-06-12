namespace Shalom.Application.Contracts;

/// <summary>A logged meal — free text plus tags from the fixed vocabulary. No calories anywhere by design.</summary>
public record MealEntryDto(
    Guid Id,
    string Text,
    IReadOnlyList<string> Tags,
    DateTimeOffset OccurredAt);
