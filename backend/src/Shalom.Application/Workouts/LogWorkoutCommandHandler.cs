using MediatR;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Common;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;
using Shalom.Domain.Entities;

namespace Shalom.Application.Workouts;

public class LogWorkoutCommandHandler : IRequestHandler<LogWorkoutCommand, WorkoutDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public LogWorkoutCommandHandler(IAppDbContext db, ICurrentUserAccessor current, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task<WorkoutDto> Handle(LogWorkoutCommand request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();
        var now = _clock.UtcNow;

        var workout = new Workout
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Equipment = request.Equipment,
            StartedAt = request.StartedAt ?? now,
            DurationMinutes = request.DurationMinutes,
            DistanceKm = request.DistanceKm,
            AvgHeartRateBpm = request.AvgHeartRateBpm,
            ActiveCalories = request.ActiveCalories,
            Notes = request.Notes,
            CreatedAt = now,
        };
        _db.Workouts.Add(workout);
        await _db.SaveChangesAsync(ct);

        return ToDto(workout);
    }

    internal static WorkoutDto ToDto(Workout w) => new(
        w.Id, w.Equipment, w.StartedAt, w.DurationMinutes,
        w.DistanceKm, w.AvgHeartRateBpm, w.ActiveCalories, w.Notes);
}
