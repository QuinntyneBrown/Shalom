using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Common;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;

namespace Shalom.Application.Fasting;

public class EndFastCommandHandler : IRequestHandler<EndFastCommand, FastingSessionDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public EndFastCommandHandler(IAppDbContext db, ICurrentUserAccessor current, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task<FastingSessionDto> Handle(EndFastCommand request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();

        var session = await _db.FastingSessions
            .Where(s => s.UserId == userId && s.EndedAt == null)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("No fast is currently running.");

        session.EndedAt = _clock.UtcNow;
        await _db.SaveChangesAsync(ct);

        return FastingMapping.ToDto(session, _clock.UtcNow);
    }
}
