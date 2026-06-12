using Shalom.Domain.Enums;

namespace Shalom.Application.Contracts;

/// <summary>A logged workout. <paramref name="Equipment"/> serializes as its enum name (e.g. "IndoorBike").</summary>
public record WorkoutDto(
    Guid Id,
    EquipmentType Equipment,
    DateTimeOffset StartedAt,
    int DurationMinutes,
    decimal? DistanceKm,
    int? AvgHeartRateBpm,
    int? ActiveCalories,
    string? Notes);
