using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Common;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;
using Shalom.Application.ImportantDates;

namespace Shalom.Application.People;

public class GetPersonQueryHandler : IRequestHandler<GetPersonQuery, PersonDetailDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public GetPersonQueryHandler(IAppDbContext db, ICurrentUserAccessor current, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task<PersonDetailDto> Handle(GetPersonQuery request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();
        var today = LocalDay.Today(_clock);

        var person = await _db.People.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.Id && p.UserId == userId && !p.IsArchived, ct)
            ?? throw new NotFoundException("Person", request.Id);

        var dates = (await _db.ImportantDates.AsNoTracking()
                .Where(d => d.PersonId == person.Id)
                .ToListAsync(ct))
            .Select(d => ImportantDateMapping.ToDto(d, today))
            .OrderBy(d => d.DaysUntil)
            .ToList();

        return new PersonDetailDto(
            person.Id, person.Name, person.Relationship, person.Phone,
            person.ContactCadenceDays, person.Notes,
            person.LastContactedOn, person.SnoozedUntil, dates);
    }
}
