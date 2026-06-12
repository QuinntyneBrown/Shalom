using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;

namespace Shalom.Application.Reading;

public class UncompleteReadingDayCommandHandler : IRequestHandler<UncompleteReadingDayCommand, ReadingDayDto>
{
    private readonly IAppDbContext _db;

    public UncompleteReadingDayCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ReadingDayDto> Handle(UncompleteReadingDayCommand request, CancellationToken ct)
    {
        var day = await _db.ReadingPlanDays.FirstOrDefaultAsync(d => d.Id == request.DayId, ct)
            ?? throw new NotFoundException($"Reading day '{request.DayId}' was not found.");

        if (day.CompletedOn is not null)
        {
            day.CompletedOn = null;
            await _db.SaveChangesAsync(ct);
        }

        return new ReadingDayDto(day.Id, day.DayNumber, day.PassageReference, day.YouVersionUrl, day.CompletedOn);
    }
}
