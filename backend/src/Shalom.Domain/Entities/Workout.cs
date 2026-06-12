using Shalom.Domain.Enums;

namespace Shalom.Domain.Entities;

public class Workout
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public EquipmentType Equipment { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public int DurationMinutes { get; set; }
    public decimal? DistanceKm { get; set; }
    public int? AvgHeartRateBpm { get; set; }
    public int? ActiveCalories { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
