using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Common;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;

namespace Shalom.Application.People;

public class GetConnectionNudgesQueryHandler
    : IRequestHandler<GetConnectionNudgesQuery, IReadOnlyList<ConnectionNudgeDto>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public GetConnectionNudgesQueryHandler(IAppDbContext db, ICurrentUserAccessor current, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task<IReadOnlyList<ConnectionNudgeDto>> Handle(GetConnectionNudgesQuery request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();
        var today = LocalDay.Today(_clock);

        var people = await _db.People.AsNoTracking()
            .Where(p => p.UserId == userId && !p.IsArchived)
            .ToListAsync(ct);

        return people
            .Where(p => ConnectionMath.IsDue(p.LastContactedOn, p.ContactCadenceDays, p.SnoozedUntil, today))
            .OrderByDescending(p => ConnectionMath.DaysSinceDue(p.LastContactedOn, p.ContactCadenceDays!.Value, today))
            .ThenBy(p => p.Name, StringComparer.OrdinalIgnoreCase)
            .Select(p => new ConnectionNudgeDto(
                p.Id, p.Name, p.Relationship,
                NudgePrompts.For(p.Name, p.Relationship, today), p.Phone))
            .ToList();
    }
}
