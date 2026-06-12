using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Contracts;
using Shalom.Application.Fasting;
using Shalom.Application.Tests.Support;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.Fasting;

public class UpdateFastingScheduleCommandHandlerTests
{
    private static User NewUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "quinn@example.com",
        NormalizedEmail = "quinn@example.com",
    };

    private static UpdateFastingScheduleCommandHandler Handler(TestApp app, Guid userId, StubDateTimeProvider clock) =>
        new(app.Db, new StubCurrentUserAccessor { UserId = userId }, clock);

    [Fact]
    public async Task Creates_the_schedule_when_none_exists_and_applies_the_request()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(
            new UpdateFastingScheduleCommand(
                new TimeOnly(11, 0), new TimeOnly(19, 0), 17,
                [new FastingOverrideDto(DayOfWeek.Saturday, new TimeOnly(12, 0), new TimeOnly(21, 0))]),
            default);

        dto.EatingWindowStart.Should().Be(new TimeOnly(11, 0));
        dto.EatingWindowEnd.Should().Be(new TimeOnly(19, 0));
        dto.TargetFastHours.Should().Be(17);
        dto.Overrides.Should().ContainSingle()
            .Which.DayOfWeek.Should().Be(DayOfWeek.Saturday);

        var stored = await app.Db.FastingSchedules.Include(s => s.Overrides).SingleAsync();
        stored.TargetFastHours.Should().Be(17);
        stored.Overrides.Should().ContainSingle();
    }

    [Fact]
    public async Task Replaces_existing_overrides_wholesale()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        app.Db.FastingSchedules.Add(FastingDefaults.CreateDefault(user.Id));
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(
            new UpdateFastingScheduleCommand(new TimeOnly(12, 0), new TimeOnly(20, 0), 16, []),
            default);

        dto.Overrides.Should().BeEmpty("the Sunday default override was replaced by an empty set");
        var stored = await app.Db.FastingSchedules.Include(s => s.Overrides).SingleAsync();
        stored.Overrides.Should().BeEmpty();
    }

    [Fact]
    public async Task The_returned_today_window_honors_a_new_override_for_today()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider(); // 2026-05-18 is a Monday in Toronto
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(
            new UpdateFastingScheduleCommand(
                new TimeOnly(12, 0), new TimeOnly(20, 0), 16,
                [new FastingOverrideDto(DayOfWeek.Monday, new TimeOnly(10, 0), new TimeOnly(18, 0))]),
            default);

        dto.TodayWindow.Start.Should().Be(new TimeOnly(10, 0));
        dto.TodayWindow.End.Should().Be(new TimeOnly(18, 0));
    }
}
