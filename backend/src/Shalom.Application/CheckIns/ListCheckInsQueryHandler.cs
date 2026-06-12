using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;

namespace Shalom.Application.CheckIns;

public class ListCheckInsQueryHandler : IRequestHandler<ListCheckInsQuery, IReadOnlyList<CheckInDto>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;

    public ListCheckInsQueryHandler(IAppDbContext db, ICurrentUserAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task<IReadOnlyList<CheckInDto>> Handle(ListCheckInsQuery request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();

        return await _db.DailyCheckIns.AsNoTracking()
            .Where(c => c.UserId == userId && c.Date >= request.From && c.Date <= request.To)
            .OrderBy(c => c.Date)
            .Select(c => new CheckInDto(c.Id, c.Date, c.MoodRating, c.SpiritualRating, c.Note))
            .ToListAsync(ct);
    }
}
