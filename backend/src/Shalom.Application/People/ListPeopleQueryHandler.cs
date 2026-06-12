using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;

namespace Shalom.Application.People;

public class ListPeopleQueryHandler : IRequestHandler<ListPeopleQuery, IReadOnlyList<PersonDto>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;

    public ListPeopleQueryHandler(IAppDbContext db, ICurrentUserAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task<IReadOnlyList<PersonDto>> Handle(ListPeopleQuery request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();

        var people = await _db.People.AsNoTracking()
            .Where(p => p.UserId == userId && !p.IsArchived)
            .OrderBy(p => p.Name)
            .ToListAsync(ct);

        return people.Select(PeopleMapping.ToDto).ToList();
    }
}
