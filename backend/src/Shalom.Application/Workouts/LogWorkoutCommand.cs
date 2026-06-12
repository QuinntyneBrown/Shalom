using MediatR;
using Shalom.Application.Contracts;
using Shalom.Domain.Enums;

namespace Shalom.Application.Workouts;

/// <summary>
/// Logs a workout. <paramref name="StartedAt"/> defaults to UtcNow — the
/// common case is logging the session just finished.
/// </summary>
public record LogWorkoutCommand(
    EquipmentType Equipment,
    int DurationMinutes,
    DateTimeOffset? StartedAt = null,
    decimal? DistanceKm = null,
    int? AvgHeartRateBpm = null,
    int? ActiveCalories = null,
    string? Notes = null) : IRequest<WorkoutDto>;
