namespace Shalom.Domain.Entities;

/// <summary>Global content (no UserId): Shalom is single-user, reading plans are shared catalogue data.</summary>
public class ReadingPlan
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public bool IsActive { get; set; }
}
