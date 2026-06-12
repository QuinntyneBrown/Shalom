using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Common;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;
using Shalom.Domain.Entities;

namespace Shalom.Application.CheckIns;

public class UpsertTodayCheckInCommandHandler : IRequestHandler<UpsertTodayCheckInCommand, CheckInDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public UpsertTodayCheckInCommandHandler(IAppDbContext db, ICurrentUserAccessor current, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task<CheckInDto> Handle(UpsertTodayCheckInCommand request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();
        var today = LocalDay.Today(_clock);
        var now = _clock.UtcNow;

        var checkIn = await _db.DailyCheckIns
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Date == today, ct);

        if (checkIn is null)
        {
            checkIn = new DailyCheckIn
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Date = today,
                MoodRating = request.MoodRating,
                SpiritualRating = request.SpiritualRating,
                Note = request.Note,
                CreatedAt = now,
            };
            _db.DailyCheckIns.Add(checkIn);
        }
        else
        {
            checkIn.MoodRating = request.MoodRating;
            checkIn.SpiritualRating = request.SpiritualRating;
            checkIn.Note = request.Note;
            checkIn.UpdatedAt = now;
        }

        await _db.SaveChangesAsync(ct);

        return new CheckInDto(checkIn.Id, checkIn.Date, checkIn.MoodRating, checkIn.SpiritualRating, checkIn.Note);
    }
}
