namespace Shalom.Domain.Entities;

/// <summary>
/// A recurring date tied to a person (birthday, anniversary). Month/Day recur
/// yearly; Year is optional (e.g. unknown birth year). Deleted with its person.
/// </summary>
public class ImportantDate
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid PersonId { get; set; }
    public string Label { get; set; } = string.Empty;
    public int Month { get; set; }
    public int Day { get; set; }
    public int? Year { get; set; }

    /// <summary>How many days ahead to surface a reminder.</summary>
    public int LeadDays { get; set; } = 7;
}
