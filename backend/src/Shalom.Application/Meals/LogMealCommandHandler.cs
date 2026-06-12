using MediatR;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Common;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;
using Shalom.Domain.Entities;

namespace Shalom.Application.Meals;

public class LogMealCommandHandler : IRequestHandler<LogMealCommand, MealEntryDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public LogMealCommandHandler(IAppDbContext db, ICurrentUserAccessor current, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task<MealEntryDto> Handle(LogMealCommand request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();
        var now = _clock.UtcNow;

        var meal = new MealEntry
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Text = request.Text.Trim(),
            Tags = MealTags.Join(request.Tags),
            OccurredAt = now,
            CreatedAt = now,
        };
        _db.MealEntries.Add(meal);
        await _db.SaveChangesAsync(ct);

        return ToDto(meal);
    }

    internal static MealEntryDto ToDto(MealEntry m) =>
        new(m.Id, m.Text, MealTags.Split(m.Tags), m.OccurredAt);
}
