using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Common;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;

namespace Shalom.Application.Fasting;

public class ListFastsQueryHandler : IRequestHandler<ListFastsQuery, IReadOnlyList<FastingSessionDto>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public ListFastsQueryHandler(IAppDbContext db, ICurrentUserAccessor current, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task<IReadOnlyList<FastingSessionDto>> Handle(ListFastsQuery request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();

        // Local-date range → UTC instants (ADR-004: day boundaries are
        // America/Toronto midnights), then plain UTC comparisons in SQL.
        var fromUtc = LocalDay.StartOfDayUtc(request.From);
        var toUtc = LocalDay.EndOfDayUtcExclusive(request.To);

        var sessions = await _db.FastingSessions.AsNoTracking()
            .Where(s => s.UserId == userId &&
                ((s.StartedAt >= fromUtc && s.StartedAt < toUtc) ||
                 (s.EndedAt != null && s.EndedAt >= fromUtc && s.EndedAt < toUtc)))
            .OrderBy(s => s.StartedAt)
            .ToListAsync(ct);

        var now = _clock.UtcNow;
        return sessions.Select(s => FastingMapping.ToDto(s, now)).ToList();
    }
}
