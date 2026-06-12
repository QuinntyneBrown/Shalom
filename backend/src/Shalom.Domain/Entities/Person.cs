namespace Shalom.Domain.Entities;

public class Person
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Relationship { get; set; }

    /// <summary>Powers the sms:/tel: quick actions; free-form, never parsed.</summary>
    public string? Phone { get; set; }

    /// <summary>Desired contact rhythm in days; nudges are derived at read time, never stored (ADR-004).</summary>
    public int? ContactCadenceDays { get; set; }

    public DateOnly? LastContactedOn { get; set; }

    /// <summary>"Not today" — the person is not nudged again until this local date arrives.</summary>
    public DateOnly? SnoozedUntil { get; set; }
    public string? Notes { get; set; }
    public bool IsArchived { get; set; }
}
