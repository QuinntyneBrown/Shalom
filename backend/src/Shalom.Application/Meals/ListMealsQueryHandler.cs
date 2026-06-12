using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Common;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;

namespace Shalom.Application.Meals;

public class ListMealsQueryHandler : IRequestHandler<ListMealsQuery, IReadOnlyList<MealEntryDto>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;

    public ListMealsQueryHandler(IAppDbContext db, ICurrentUserAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task<IReadOnlyList<MealEntryDto>> Handle(ListMealsQuery request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();

        var fromUtc = LocalDay.StartOfDayUtc(request.From);
        var toUtc = LocalDay.EndOfDayUtcExclusive(request.To);

        var meals = await _db.MealEntries.AsNoTracking()
            .Where(m => m.UserId == userId && m.OccurredAt >= fromUtc && m.OccurredAt < toUtc)
            .OrderByDescending(m => m.OccurredAt)
            .ToListAsync(ct);

        return meals.Select(LogMealCommandHandler.ToDto).ToList();
    }
}
