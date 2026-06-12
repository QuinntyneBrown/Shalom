using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;

namespace Shalom.Application.Gratitude;

public class ListGratitudeQueryHandler : IRequestHandler<ListGratitudeQuery, IReadOnlyList<GratitudeEntryDto>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;

    public ListGratitudeQueryHandler(IAppDbContext db, ICurrentUserAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task<IReadOnlyList<GratitudeEntryDto>> Handle(ListGratitudeQuery request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();

        var query = _db.GratitudeEntries.AsNoTracking()
            .Where(e => e.UserId == userId);

        if (request.PersonId is { } personId)
            query = query.Where(e => e.PersonId == personId);

        var entries = await query
            .OrderByDescending(e => e.CreatedAt)
            .Take(request.Take)
            .ToListAsync(ct);

        return entries.Select(AddGratitudeEntryCommandHandler.ToDto).ToList();
    }
}
