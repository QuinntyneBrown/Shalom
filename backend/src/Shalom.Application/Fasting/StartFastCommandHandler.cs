using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Common;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;
using Shalom.Domain.Entities;

namespace Shalom.Application.Fasting;

public class StartFastCommandHandler : IRequestHandler<StartFastCommand, FastingSessionDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public StartFastCommandHandler(IAppDbContext db, ICurrentUserAccessor current, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task<FastingSessionDto> Handle(StartFastCommand request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();

        var hasOpen = await _db.FastingSessions
            .AnyAsync(s => s.UserId == userId && s.EndedAt == null, ct);
        if (hasOpen)
            throw new ConflictException("fast_already_open", "A fast is already running — end it before starting another.");

        // Target falls back to the schedule (16 when no schedule exists yet;
        // the row itself is created lazily by GetCurrentFastQuery).
        var scheduleTarget = await _db.FastingSchedules.AsNoTracking()
            .Where(s => s.UserId == userId)
            .Select(s => (int?)s.TargetFastHours)
            .FirstOrDefaultAsync(ct);

        var session = new FastingSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            StartedAt = _clock.UtcNow,
            TargetHours = request.TargetHours ?? scheduleTarget ?? FastingDefaults.TargetFastHours,
        };
        _db.FastingSessions.Add(session);
        await _db.SaveChangesAsync(ct);

        return FastingMapping.ToDto(session, _clock.UtcNow);
    }
}
