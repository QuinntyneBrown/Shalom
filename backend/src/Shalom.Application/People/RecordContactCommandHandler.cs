using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Common;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;

namespace Shalom.Application.People;

public class RecordContactCommandHandler : IRequestHandler<RecordContactCommand, PersonDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public RecordContactCommandHandler(IAppDbContext db, ICurrentUserAccessor current, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task<PersonDto> Handle(RecordContactCommand request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();

        var person = await _db.People
            .FirstOrDefaultAsync(p => p.Id == request.PersonId && p.UserId == userId && !p.IsArchived, ct)
            ?? throw new NotFoundException("Person", request.PersonId);

        person.LastContactedOn = LocalDay.Today(_clock);
        person.SnoozedUntil = null;
        await _db.SaveChangesAsync(ct);

        return PeopleMapping.ToDto(person);
    }
}
