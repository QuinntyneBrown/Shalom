using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Exceptions;

namespace Shalom.Application.People;

public class ArchivePersonCommandHandler : IRequestHandler<ArchivePersonCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;

    public ArchivePersonCommandHandler(IAppDbContext db, ICurrentUserAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task Handle(ArchivePersonCommand request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();

        var person = await _db.People
            .FirstOrDefaultAsync(p => p.Id == request.Id && p.UserId == userId, ct)
            ?? throw new NotFoundException("Person", request.Id);

        person.IsArchived = true;
        await _db.SaveChangesAsync(ct);
    }
}
