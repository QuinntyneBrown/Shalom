using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Common;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;
using Shalom.Domain.Entities;

namespace Shalom.Application.Fasting;

public class UpdateFastingScheduleCommandHandler
    : IRequestHandler<UpdateFastingScheduleCommand, FastingScheduleDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public UpdateFastingScheduleCommandHandler(IAppDbContext db, ICurrentUserAccessor current, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task<FastingScheduleDto> Handle(UpdateFastingScheduleCommand request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();

        var schedule = await _db.FastingSchedules
            .Include(s => s.Overrides)
            .FirstOrDefaultAsync(s => s.UserId == userId, ct);

        if (schedule is null)
        {
            schedule = FastingDefaults.CreateDefault(userId);
            schedule.Overrides.Clear();
            _db.FastingSchedules.Add(schedule);
        }

        schedule.EatingWindowStart = request.WindowStart;
        schedule.EatingWindowEnd = request.WindowEnd;
        schedule.TargetFastHours = request.TargetFastHours;

        schedule.Overrides.Clear();
        foreach (var o in request.Overrides)
        {
            schedule.Overrides.Add(new FastingScheduleOverride
            {
                DayOfWeek = o.DayOfWeek,
                EatingWindowStart = o.EatingWindowStart,
                EatingWindowEnd = o.EatingWindowEnd,
            });
        }

        await _db.SaveChangesAsync(ct);

        return FastingMapping.ToDto(schedule, LocalDay.Today(_clock, schedule.TimeZoneId));
    }
}
