using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Common;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;
using Shalom.Domain.Entities;

namespace Shalom.Application.ImportantDates;

public class AddImportantDateCommandHandler : IRequestHandler<AddImportantDateCommand, ImportantDateDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public AddImportantDateCommandHandler(IAppDbContext db, ICurrentUserAccessor current, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task<ImportantDateDto> Handle(AddImportantDateCommand request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();

        var personExists = await _db.People
            .AnyAsync(p => p.Id == request.PersonId && p.UserId == userId && !p.IsArchived, ct);
        if (!personExists)
            throw new NotFoundException("Person", request.PersonId);

        var date = new ImportantDate
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PersonId = request.PersonId,
            Label = request.Label.Trim(),
            Month = request.Month,
            Day = request.Day,
            Year = request.Year,
            LeadDays = request.LeadDays,
        };
        _db.ImportantDates.Add(date);
        await _db.SaveChangesAsync(ct);

        return ImportantDateMapping.ToDto(date, LocalDay.Today(_clock));
    }
}
