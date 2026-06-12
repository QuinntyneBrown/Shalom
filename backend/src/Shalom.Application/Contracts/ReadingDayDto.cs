namespace Shalom.Application.Contracts;

/// <summary>One day of a reading plan. <paramref name="CompletedOn"/> is the local day it was read, or null.</summary>
public record ReadingDayDto(Guid Id, int DayNumber, string PassageReference, string YouVersionUrl, DateOnly? CompletedOn);
