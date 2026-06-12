namespace Shalom.Domain.Entities;

/// <summary>Global content (no UserId): one verse per day-of-year, World English Bible text.</summary>
public class VerseOfDay
{
    public Guid Id { get; set; }

    /// <summary>1–366; unique.</summary>
    public int DayOfYear { get; set; }

    /// <summary>e.g. "John 3:16".</summary>
    public string Reference { get; set; } = string.Empty;

    /// <summary>World English Bible (WEB) text.</summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>Deep link, e.g. https://www.bible.com/bible/111/JHN.3.16</summary>
    public string YouVersionUrl { get; set; } = string.Empty;
}
