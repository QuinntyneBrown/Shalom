using MediatR;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;
using Shalom.Domain.Entities;

namespace Shalom.Application.People;

public class CreatePersonCommandHandler : IRequestHandler<CreatePersonCommand, PersonDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;

    public CreatePersonCommandHandler(IAppDbContext db, ICurrentUserAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task<PersonDto> Handle(CreatePersonCommand request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();

        var person = new Person
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name.Trim(),
            Relationship = request.Relationship?.Trim(),
            Phone = request.Phone?.Trim(),
            ContactCadenceDays = request.ContactCadenceDays,
            Notes = request.Notes,
        };
        _db.People.Add(person);
        await _db.SaveChangesAsync(ct);

        return PeopleMapping.ToDto(person);
    }
}
