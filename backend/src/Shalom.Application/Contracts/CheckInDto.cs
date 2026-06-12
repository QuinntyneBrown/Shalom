namespace Shalom.Application.Contracts;

/// <summary>A daily check-in. <paramref name="Date"/> is the server-derived America/Toronto local day (ADR-004).</summary>
public record CheckInDto(Guid Id, DateOnly Date, int MoodRating, int SpiritualRating, string? Note);
