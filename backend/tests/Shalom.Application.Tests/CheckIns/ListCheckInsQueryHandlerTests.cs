using FluentAssertions;
using Shalom.Application.CheckIns;
using Shalom.Application.Tests.Support;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.CheckIns;

public class ListCheckInsQueryHandlerTests
{
    [Fact]
    public async Task Returns_only_the_current_users_check_ins_inside_the_range_ordered_by_date()
    {
        await using var app = TestApp.Create();
        var userId = Guid.NewGuid();
        var otherId = Guid.NewGuid();

        app.Db.DailyCheckIns.AddRange(
            new DailyCheckIn { Id = Guid.NewGuid(), UserId = userId, Date = new DateOnly(2026, 5, 10), MoodRating = 3, SpiritualRating = 3 },
            new DailyCheckIn { Id = Guid.NewGuid(), UserId = userId, Date = new DateOnly(2026, 5, 12), MoodRating = 4, SpiritualRating = 4 },
            new DailyCheckIn { Id = Guid.NewGuid(), UserId = userId, Date = new DateOnly(2026, 5, 20), MoodRating = 5, SpiritualRating = 5 },
            new DailyCheckIn { Id = Guid.NewGuid(), UserId = otherId, Date = new DateOnly(2026, 5, 11), MoodRating = 1, SpiritualRating = 1 });
        await app.Db.SaveChangesAsync();

        var handler = new ListCheckInsQueryHandler(app.Db, new StubCurrentUserAccessor { UserId = userId });
        var result = await handler.Handle(
            new ListCheckInsQuery(new DateOnly(2026, 5, 9), new DateOnly(2026, 5, 15)), default);

        result.Should().HaveCount(2);
        result.Select(c => c.Date).Should().ContainInOrder(new DateOnly(2026, 5, 10), new DateOnly(2026, 5, 12));
    }

    [Fact]
    public void Validator_rejects_to_before_from()
    {
        var validator = new ListCheckInsQueryValidator();
        var result = validator.Validate(new ListCheckInsQuery(new DateOnly(2026, 5, 10), new DateOnly(2026, 5, 9)));
        result.IsValid.Should().BeFalse();
    }
}
