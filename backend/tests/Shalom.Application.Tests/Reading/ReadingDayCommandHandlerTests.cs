using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Common;
using Shalom.Application.Exceptions;
using Shalom.Application.Reading;
using Shalom.Application.Tests.Support;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.Reading;

public class ReadingDayCommandHandlerTests
{
    private static (ReadingPlan Plan, ReadingPlanDay Day) NewPlanWithDay(DateOnly? completedOn = null)
    {
        var plan = new ReadingPlan
        {
            Id = Guid.NewGuid(),
            Name = "John & His Letters",
            StartDate = new DateOnly(2026, 5, 1),
            IsActive = true,
        };
        var day = new ReadingPlanDay
        {
            Id = Guid.NewGuid(),
            ReadingPlanId = plan.Id,
            DayNumber = 1,
            PassageReference = "John 1",
            YouVersionUrl = "https://www.bible.com/bible/111/JHN.1",
            CompletedOn = completedOn,
        };
        return (plan, day);
    }

    [Fact]
    public async Task Complete_sets_completed_on_to_todays_local_date()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var (plan, day) = NewPlanWithDay();
        app.Db.ReadingPlans.Add(plan);
        app.Db.ReadingPlanDays.Add(day);
        await app.Db.SaveChangesAsync();

        var handler = new CompleteReadingDayCommandHandler(app.Db, clock);
        var dto = await handler.Handle(new CompleteReadingDayCommand(day.Id), default);

        dto.CompletedOn.Should().Be(LocalDay.Today(clock));
        (await app.Db.ReadingPlanDays.SingleAsync()).CompletedOn.Should().Be(LocalDay.Today(clock));
    }

    [Fact]
    public async Task Complete_is_idempotent_an_already_completed_day_keeps_its_original_date()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var originalDate = LocalDay.Today(clock).AddDays(-3);
        var (plan, day) = NewPlanWithDay(completedOn: originalDate);
        app.Db.ReadingPlans.Add(plan);
        app.Db.ReadingPlanDays.Add(day);
        await app.Db.SaveChangesAsync();

        var handler = new CompleteReadingDayCommandHandler(app.Db, clock);
        var dto = await handler.Handle(new CompleteReadingDayCommand(day.Id), default);

        dto.CompletedOn.Should().Be(originalDate);
        (await app.Db.ReadingPlanDays.SingleAsync()).CompletedOn.Should().Be(originalDate);
    }

    [Fact]
    public async Task Complete_unknown_day_throws_not_found()
    {
        await using var app = TestApp.Create();
        var handler = new CompleteReadingDayCommandHandler(app.Db, new StubDateTimeProvider());

        var act = async () => await handler.Handle(new CompleteReadingDayCommand(Guid.NewGuid()), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Uncomplete_clears_completed_on()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var (plan, day) = NewPlanWithDay(completedOn: LocalDay.Today(clock));
        app.Db.ReadingPlans.Add(plan);
        app.Db.ReadingPlanDays.Add(day);
        await app.Db.SaveChangesAsync();

        var handler = new UncompleteReadingDayCommandHandler(app.Db);
        var dto = await handler.Handle(new UncompleteReadingDayCommand(day.Id), default);

        dto.CompletedOn.Should().BeNull();
        (await app.Db.ReadingPlanDays.SingleAsync()).CompletedOn.Should().BeNull();
    }

    [Fact]
    public async Task Uncomplete_an_uncompleted_day_is_a_no_op_success()
    {
        await using var app = TestApp.Create();
        var (plan, day) = NewPlanWithDay();
        app.Db.ReadingPlans.Add(plan);
        app.Db.ReadingPlanDays.Add(day);
        await app.Db.SaveChangesAsync();

        var handler = new UncompleteReadingDayCommandHandler(app.Db);
        var dto = await handler.Handle(new UncompleteReadingDayCommand(day.Id), default);

        dto.CompletedOn.Should().BeNull();
    }
}
