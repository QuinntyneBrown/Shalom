namespace Shalom.Domain.Entities;

public class DailyCheckIn
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    /// <summary>Local calendar day (America/Toronto), derived server-side per ADR-004. One check-in per user per day.</summary>
    public DateOnly Date { get; set; }

    /// <summary>1–5.</summary>
    public int MoodRating { get; set; }

    /// <summary>1–5.</summary>
    public int SpiritualRating { get; set; }

    public string? Note { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}
