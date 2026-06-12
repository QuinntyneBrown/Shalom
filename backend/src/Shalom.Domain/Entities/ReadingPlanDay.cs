namespace Shalom.Domain.Entities;

public class ReadingPlanDay
{
    public Guid Id { get; set; }
    public Guid ReadingPlanId { get; set; }
    public int DayNumber { get; set; }

    /// <summary>Human-readable passage, e.g. "John 1".</summary>
    public string PassageReference { get; set; } = string.Empty;

    /// <summary>Deep link, e.g. https://www.bible.com/bible/111/JHN.1</summary>
    public string YouVersionUrl { get; set; } = string.Empty;

    /// <summary>Local day the reading was completed (single-user app, so completion lives on the day itself).</summary>
    public DateOnly? CompletedOn { get; set; }
}
