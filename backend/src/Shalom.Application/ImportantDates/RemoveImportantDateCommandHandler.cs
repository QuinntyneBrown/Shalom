using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Exceptions;

namespace Shalom.Application.ImportantDates;

public class RemoveImportantDateCommandHandler : IRequestHandler<RemoveImportantDateCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;

    public RemoveImportantDateCommandHandler(IAppDbContext db, ICurrentUserAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task Handle(RemoveImportantDateCommand request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();

        var date = await _db.ImportantDates
            .FirstOrDefaultAsync(d => d.Id == request.Id && d.UserId == userId, ct)
            ?? throw new NotFoundException("Important date", request.Id);

        _db.ImportantDates.Remove(date);
        await _db.SaveChangesAsync(ct);
    }
}
