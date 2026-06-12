namespace Shalom.Domain.Entities;

/// <summary>
/// A logged meal — patterns, not calories. Free text plus tags from a small
/// fixed vocabulary (home-cooked, fish, veggie, takeout, late-night) stored
/// comma-joined; no nutrition math anywhere by design.
/// </summary>
public class MealEntry
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Text { get; set; } = string.Empty;

    /// <summary>Comma-joined tags from the fixed set, e.g. "home-cooked,fish". Empty when untagged.</summary>
    public string Tags { get; set; } = string.Empty;

    public DateTimeOffset OccurredAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
