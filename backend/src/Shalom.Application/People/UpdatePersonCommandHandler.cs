using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;

namespace Shalom.Application.People;

public class UpdatePersonCommandHandler : IRequestHandler<UpdatePersonCommand, PersonDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;

    public UpdatePersonCommandHandler(IAppDbContext db, ICurrentUserAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task<PersonDto> Handle(UpdatePersonCommand request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();

        // Ownership folded into the lookup — someone else's id reads as "not found".
        var person = await _db.People
            .FirstOrDefaultAsync(p => p.Id == request.Id && p.UserId == userId && !p.IsArchived, ct)
            ?? throw new NotFoundException("Person", request.Id);

        person.Name = request.Name.Trim();
        person.Relationship = request.Relationship?.Trim();
        person.Phone = request.Phone?.Trim();
        person.ContactCadenceDays = request.ContactCadenceDays;
        person.Notes = request.Notes;
        await _db.SaveChangesAsync(ct);

        return PeopleMapping.ToDto(person);
    }
}
