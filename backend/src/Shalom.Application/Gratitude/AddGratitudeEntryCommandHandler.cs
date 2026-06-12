using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Common;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;
using Shalom.Domain.Entities;

namespace Shalom.Application.Gratitude;

public class AddGratitudeEntryCommandHandler : IRequestHandler<AddGratitudeEntryCommand, GratitudeEntryDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public AddGratitudeEntryCommandHandler(IAppDbContext db, ICurrentUserAccessor current, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task<GratitudeEntryDto> Handle(AddGratitudeEntryCommand request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();

        if (request.PersonId is { } personId)
        {
            var personExists = await _db.People
                .AnyAsync(p => p.Id == personId && p.UserId == userId, ct);
            if (!personExists)
                throw new NotFoundException("Person", personId);
        }

        var entry = new GratitudeEntry
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PersonId = request.PersonId,
            Text = request.Text.Trim(),
            OccurredOn = LocalDay.Today(_clock),
            CreatedAt = _clock.UtcNow,
        };
        _db.GratitudeEntries.Add(entry);
        await _db.SaveChangesAsync(ct);

        return ToDto(entry);
    }

    internal static GratitudeEntryDto ToDto(GratitudeEntry e) =>
        new(e.Id, e.PersonId, e.Text, e.OccurredOn);
}
