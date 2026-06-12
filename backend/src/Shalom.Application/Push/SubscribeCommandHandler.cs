using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Common;
using Shalom.Application.Exceptions;
using Shalom.Domain.Entities;

namespace Shalom.Application.Push;

public class SubscribeCommandHandler : IRequestHandler<SubscribeCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public SubscribeCommandHandler(IAppDbContext db, ICurrentUserAccessor current, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task Handle(SubscribeCommand request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();
        var endpoint = request.Endpoint.Trim();

        var existing = await _db.PushSubscriptions
            .FirstOrDefaultAsync(s => s.Endpoint == endpoint, ct);

        if (existing is null)
        {
            _db.PushSubscriptions.Add(new PushSubscription
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Endpoint = endpoint,
                P256dh = request.P256dh,
                Auth = request.Auth,
                CreatedAt = _clock.UtcNow,
                LastSeenAt = _clock.UtcNow,
                FailedCount = 0,
            });
        }
        else
        {
            // Same endpoint, fresh keys (or a clean re-enable): refresh in
            // place and forgive past delivery failures.
            existing.UserId = userId;
            existing.P256dh = request.P256dh;
            existing.Auth = request.Auth;
            existing.LastSeenAt = _clock.UtcNow;
            existing.FailedCount = 0;
        }

        await _db.SaveChangesAsync(ct);
    }
}
