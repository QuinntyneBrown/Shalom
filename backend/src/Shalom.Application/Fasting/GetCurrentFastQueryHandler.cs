using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Common;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;

namespace Shalom.Application.Fasting;

public class GetCurrentFastQueryHandler : IRequestHandler<GetCurrentFastQuery, CurrentFastDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public GetCurrentFastQueryHandler(IAppDbContext db, ICurrentUserAccessor current, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task<CurrentFastDto> Handle(GetCurrentFastQuery request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();

        var schedule = await _db.FastingSchedules
            .Include(s => s.Overrides)
            .FirstOrDefaultAsync(s => s.UserId == userId, ct);

        if (schedule is null)
        {
            schedule = FastingDefaults.CreateDefault(userId);
            _db.FastingSchedules.Add(schedule);
            await _db.SaveChangesAsync(ct);
        }

        var open = await _db.FastingSessions.AsNoTracking()
            .Where(s => s.UserId == userId && s.EndedAt == null)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync(ct);

        var today = LocalDay.Today(_clock, schedule.TimeZoneId);

        return new CurrentFastDto(
            open is null ? null : FastingMapping.ToDto(open, _clock.UtcNow),
            FastingMapping.ToDto(schedule, today));
    }
}
