namespace Shalom.Domain.Entities;

public class Person
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Relationship { get; set; }

    /// <summary>Desired contact rhythm in days; nudges are derived at read time, never stored (ADR-004).</summary>
    public int? ContactCadenceDays { get; set; }

    public DateOnly? LastContactedOn { get; set; }
    public string? Notes { get; set; }
    public bool IsArchived { get; set; }
}
