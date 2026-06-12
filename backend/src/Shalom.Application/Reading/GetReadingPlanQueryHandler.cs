using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;

namespace Shalom.Application.Reading;

public class GetReadingPlanQueryHandler : IRequestHandler<GetReadingPlanQuery, ReadingPlanDto>
{
    private readonly IAppDbContext _db;

    public GetReadingPlanQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ReadingPlanDto> Handle(GetReadingPlanQuery request, CancellationToken ct)
    {
        var plan = await _db.ReadingPlans.AsNoTracking().FirstOrDefaultAsync(p => p.IsActive, ct)
            ?? throw new NotFoundException("No active reading plan.");

        var days = await _db.ReadingPlanDays.AsNoTracking()
            .Where(d => d.ReadingPlanId == plan.Id)
            .OrderBy(d => d.DayNumber)
            .Select(d => new ReadingDayDto(d.Id, d.DayNumber, d.PassageReference, d.YouVersionUrl, d.CompletedOn))
            .ToListAsync(ct);

        return new ReadingPlanDto(
            plan.Id,
            plan.Name,
            plan.StartDate,
            plan.IsActive,
            days.Count(d => d.CompletedOn is not null),
            days.Count,
            days);
    }
}
