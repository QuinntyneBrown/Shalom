using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Exceptions;
using Shalom.Application.Fasting;
using Shalom.Application.Tests.Support;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.Fasting;

public class GetCurrentFastQueryHandlerTests
{
    private static User NewUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "quinn@example.com",
        NormalizedEmail = "quinn@example.com",
    };

    private static GetCurrentFastQueryHandler Handler(TestApp app, Guid userId, StubDateTimeProvider clock) =>
        new(app.Db, new StubCurrentUserAccessor { UserId = userId }, clock);

    [Fact]
    public async Task First_call_lazily_creates_the_default_schedule_with_the_sunday_override()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider(); // 2026-05-18 (a Monday in Toronto)
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new GetCurrentFastQuery(), default);

        dto.Current.Should().BeNull();
        dto.Schedule.TargetFastHours.Should().Be(16);
        dto.Schedule.EatingWindowStart.Should().Be(new TimeOnly(12, 0));
        dto.Schedule.EatingWindowEnd.Should().Be(new TimeOnly(20, 0));
        dto.Schedule.TimeZoneId.Should().Be("America/Toronto");
        dto.Schedule.Overrides.Should().ContainSingle();
        dto.Schedule.Overrides[0].DayOfWeek.Should().Be(DayOfWeek.Sunday);
        dto.Schedule.Overrides[0].EatingWindowStart.Should().Be(new TimeOnly(13, 30));
        dto.Schedule.Overrides[0].EatingWindowEnd.Should().Be(new TimeOnly(20, 30));

        // Monday uses the default window, not the Sunday override.
        dto.Schedule.TodayWindow.Start.Should().Be(new TimeOnly(12, 0));
        dto.Schedule.TodayWindow.End.Should().Be(new TimeOnly(20, 0));

        var stored = await app.Db.FastingSchedules.Include(s => s.Overrides).SingleAsync();
        stored.UserId.Should().Be(user.Id);
        stored.Overrides.Should().ContainSingle();
    }

    [Fact]
    public async Task Second_call_reuses_the_lazily_created_schedule()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var handler = Handler(app, user.Id, clock);
        await handler.Handle(new GetCurrentFastQuery(), default);
        await handler.Handle(new GetCurrentFastQuery(), default);

        (await app.Db.FastingSchedules.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task On_a_sunday_the_today_window_honors_the_override()
    {
        await using var app = TestApp.Create();
        // 2026-05-17 is a Sunday; 12:00Z is 08:00 in Toronto (EDT).
        var clock = new StubDateTimeProvider { UtcNow = new DateTimeOffset(2026, 5, 17, 12, 0, 0, TimeSpan.Zero) };
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new GetCurrentFastQuery(), default);

        dto.Schedule.TodayWindow.Start.Should().Be(new TimeOnly(13, 30));
        dto.Schedule.TodayWindow.End.Should().Be(new TimeOnly(20, 30));
    }

    [Fact]
    public async Task Returns_the_open_session_with_live_elapsed_and_no_outcome()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        app.Db.FastingSessions.Add(new FastingSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            StartedAt = clock.UtcNow.AddHours(-11.5),
            TargetHours = 16,
        });
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new GetCurrentFastQuery(), default);

        dto.Current.Should().NotBeNull();
        dto.Current!.EndedAt.Should().BeNull();
        dto.Current.Outcome.Should().BeNull("a fast still running has no outcome");
        dto.Current.ElapsedHours.Should().BeApproximately(11.5, 0.01);
    }

    [Fact]
    public async Task Without_an_authenticated_user_throws_invalid_credentials()
    {
        await using var app = TestApp.Create();
        var handler = new GetCurrentFastQueryHandler(
            app.Db, new StubCurrentUserAccessor(), new StubDateTimeProvider());

        var act = async () => await handler.Handle(new GetCurrentFastQuery(), default);

        await act.Should().ThrowAsync<InvalidCredentialsException>();
    }
}
