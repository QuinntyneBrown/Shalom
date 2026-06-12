using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Exceptions;
using Shalom.Application.Fasting;
using Shalom.Application.Tests.Support;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.Fasting;

public class StartFastCommandHandlerTests
{
    private static User NewUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "quinn@example.com",
        NormalizedEmail = "quinn@example.com",
    };

    private static StartFastCommandHandler Handler(TestApp app, Guid userId, StubDateTimeProvider clock) =>
        new(app.Db, new StubCurrentUserAccessor { UserId = userId }, clock);

    [Fact]
    public async Task Starts_at_utc_now_with_the_schedule_target_by_default()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        app.Db.FastingSchedules.Add(new FastingSchedule
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            EatingWindowStart = new TimeOnly(12, 0),
            EatingWindowEnd = new TimeOnly(20, 0),
            TargetFastHours = 18,
        });
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new StartFastCommand(), default);

        dto.StartedAt.Should().Be(clock.UtcNow);
        dto.TargetHours.Should().Be(18, "the schedule's target is the default");
        dto.EndedAt.Should().BeNull();
        dto.Outcome.Should().BeNull();

        var stored = await app.Db.FastingSessions.SingleAsync();
        stored.UserId.Should().Be(user.Id);
        stored.TargetHours.Should().Be(18);
    }

    [Fact]
    public async Task Without_a_schedule_the_target_falls_back_to_16()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new StartFastCommand(), default);

        dto.TargetHours.Should().Be(16);
    }

    [Fact]
    public async Task An_explicit_target_wins_over_the_schedule()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new StartFastCommand(20), default);

        dto.TargetHours.Should().Be(20);
    }

    [Fact]
    public async Task Rejects_starting_when_a_fast_is_already_open()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        app.Db.FastingSessions.Add(new FastingSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            StartedAt = clock.UtcNow.AddHours(-2),
            TargetHours = 16,
        });
        await app.Db.SaveChangesAsync();

        var act = async () => await Handler(app, user.Id, clock).Handle(new StartFastCommand(), default);

        await act.Should().ThrowAsync<ConflictException>();
        (await app.Db.FastingSessions.CountAsync()).Should().Be(1, "no second session may be created");
    }

    [Fact]
    public async Task Without_an_authenticated_user_throws_invalid_credentials()
    {
        await using var app = TestApp.Create();
        var handler = new StartFastCommandHandler(
            app.Db, new StubCurrentUserAccessor(), new StubDateTimeProvider());

        var act = async () => await handler.Handle(new StartFastCommand(), default);

        await act.Should().ThrowAsync<InvalidCredentialsException>();
    }
}
