namespace Shalom.Domain.Entities;

public class GratitudeEntry
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    /// <summary>Optional link to a person; set to null (not deleted) when the person is removed.</summary>
    public Guid? PersonId { get; set; }

    public string Text { get; set; } = string.Empty;
    public DateOnly OccurredOn { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
