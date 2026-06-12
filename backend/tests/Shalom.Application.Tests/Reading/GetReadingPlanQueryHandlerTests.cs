using FluentAssertions;
using Shalom.Application.Exceptions;
using Shalom.Application.Reading;
using Shalom.Application.Tests.Support;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.Reading;

public class GetReadingPlanQueryHandlerTests
{
    [Fact]
    public async Task Returns_the_active_plan_with_days_ordered_and_completion_counts()
    {
        await using var app = TestApp.Create();
        var active = new ReadingPlan { Id = Guid.NewGuid(), Name = "Active", StartDate = new DateOnly(2026, 5, 1), IsActive = true };
        var inactive = new ReadingPlan { Id = Guid.NewGuid(), Name = "Old", StartDate = new DateOnly(2025, 1, 1), IsActive = false };
        app.Db.ReadingPlans.AddRange(active, inactive);
        app.Db.ReadingPlanDays.AddRange(
            new ReadingPlanDay { Id = Guid.NewGuid(), ReadingPlanId = active.Id, DayNumber = 2, PassageReference = "John 2", YouVersionUrl = "https://www.bible.com/bible/111/JHN.2" },
            new ReadingPlanDay { Id = Guid.NewGuid(), ReadingPlanId = active.Id, DayNumber = 1, PassageReference = "John 1", YouVersionUrl = "https://www.bible.com/bible/111/JHN.1", CompletedOn = new DateOnly(2026, 5, 17) },
            new ReadingPlanDay { Id = Guid.NewGuid(), ReadingPlanId = inactive.Id, DayNumber = 1, PassageReference = "Mark 1", YouVersionUrl = "https://www.bible.com/bible/111/MRK.1" });
        await app.Db.SaveChangesAsync();

        var handler = new GetReadingPlanQueryHandler(app.Db);
        var dto = await handler.Handle(new GetReadingPlanQuery(), default);

        dto.Name.Should().Be("Active");
        dto.TotalDays.Should().Be(2);
        dto.CompletedCount.Should().Be(1);
        dto.Days.Select(d => d.DayNumber).Should().ContainInOrder(1, 2);
        dto.Days[0].CompletedOn.Should().Be(new DateOnly(2026, 5, 17));
        dto.Days[1].CompletedOn.Should().BeNull();
    }

    [Fact]
    public async Task Throws_not_found_when_no_plan_is_active()
    {
        await using var app = TestApp.Create();
        var handler = new GetReadingPlanQueryHandler(app.Db);

        var act = async () => await handler.Handle(new GetReadingPlanQuery(), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }
}
