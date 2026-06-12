using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Exceptions;

namespace Shalom.Application.Push;

public class UnsubscribeCommandHandler : IRequestHandler<UnsubscribeCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;

    public UnsubscribeCommandHandler(IAppDbContext db, ICurrentUserAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task Handle(UnsubscribeCommand request, CancellationToken ct)
    {
        _ = _current.UserId ?? throw new InvalidCredentialsException();
        var endpoint = request.Endpoint.Trim();

        var existing = await _db.PushSubscriptions
            .FirstOrDefaultAsync(s => s.Endpoint == endpoint, ct);
        if (existing is null) return;

        _db.PushSubscriptions.Remove(existing);
        await _db.SaveChangesAsync(ct);
    }
}
