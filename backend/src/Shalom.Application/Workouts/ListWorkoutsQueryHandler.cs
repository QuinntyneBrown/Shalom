using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Common;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;

namespace Shalom.Application.Workouts;

public class ListWorkoutsQueryHandler : IRequestHandler<ListWorkoutsQuery, IReadOnlyList<WorkoutDto>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;

    public ListWorkoutsQueryHandler(IAppDbContext db, ICurrentUserAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task<IReadOnlyList<WorkoutDto>> Handle(ListWorkoutsQuery request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();

        var fromUtc = LocalDay.StartOfDayUtc(request.From);
        var toUtc = LocalDay.EndOfDayUtcExclusive(request.To);

        return await _db.Workouts.AsNoTracking()
            .Where(w => w.UserId == userId && w.StartedAt >= fromUtc && w.StartedAt < toUtc)
            .OrderByDescending(w => w.StartedAt)
            .Select(w => new WorkoutDto(
                w.Id, w.Equipment, w.StartedAt, w.DurationMinutes,
                w.DistanceKm, w.AvgHeartRateBpm, w.ActiveCalories, w.Notes))
            .ToListAsync(ct);
    }
}
