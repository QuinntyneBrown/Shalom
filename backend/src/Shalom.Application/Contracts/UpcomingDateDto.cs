namespace Shalom.Application.Contracts;

/// <summary>An important date inside its lead window, surfaced on Today.</summary>
public record UpcomingDateDto(
    Guid PersonId,
    string PersonName,
    string Label,
    DateOnly Date,
    int DaysUntil);
