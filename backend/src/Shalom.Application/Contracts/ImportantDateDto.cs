namespace Shalom.Application.Contracts;

/// <summary>
/// A recurring date with its derived next occurrence. <paramref name="NextOccurrence"/>
/// and <paramref name="DaysUntil"/> are computed from the server's local today
/// (Feb 29 birthdays land on Feb 28 in non-leap years).
/// </summary>
public record ImportantDateDto(
    Guid Id,
    Guid PersonId,
    string Label,
    int Month,
    int Day,
    int? Year,
    int LeadDays,
    DateOnly NextOccurrence,
    int DaysUntil);
