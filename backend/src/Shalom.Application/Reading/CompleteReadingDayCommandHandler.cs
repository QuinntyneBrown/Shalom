using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Common;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;

namespace Shalom.Application.Reading;

public class CompleteReadingDayCommandHandler : IRequestHandler<CompleteReadingDayCommand, ReadingDayDto>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _clock;

    public CompleteReadingDayCommandHandler(IAppDbContext db, IDateTimeProvider clock)
    {
        _db = db;
        _clock = clock;
    }

    public async Task<ReadingDayDto> Handle(CompleteReadingDayCommand request, CancellationToken ct)
    {
        var day = await _db.ReadingPlanDays.FirstOrDefaultAsync(d => d.Id == request.DayId, ct)
            ?? throw new NotFoundException($"Reading day '{request.DayId}' was not found.");

        if (day.CompletedOn is null)
        {
            day.CompletedOn = LocalDay.Today(_clock);
            await _db.SaveChangesAsync(ct);
        }

        return new ReadingDayDto(day.Id, day.DayNumber, day.PassageReference, day.YouVersionUrl, day.CompletedOn);
    }
}
