namespace Shalom.Application.Contracts;

/// <summary>A private gratitude note — just between him and God.</summary>
public record GratitudeEntryDto(
    Guid Id,
    Guid? PersonId,
    string Text,
    DateOnly OccurredOn);
