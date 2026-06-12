using FluentAssertions;
using Shalom.Application.Fasting;
using Shalom.Application.Tests.Support;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.Fasting;

public class ListFastsQueryHandlerTests
{
    private static User NewUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "quinn@example.com",
        NormalizedEmail = "quinn@example.com",
    };

    private static ListFastsQueryHandler Handler(TestApp app, Guid userId, StubDateTimeProvider clock) =>
        new(app.Db, new StubCurrentUserAccessor { UserId = userId }, clock);

    [Fact]
    public async Task Returns_sessions_in_range_with_derived_outcomes()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider(); // 2026-05-18 (Monday), 12:00Z
        var user = NewUser();
        app.Db.Users.Add(user);

        // Completed: 16h target, ran 16.5h, ended Sunday evening local.
        app.Db.FastingSessions.Add(new FastingSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            StartedAt = new DateTimeOffset(2026, 5, 16, 23, 0, 0, TimeSpan.Zero),
            TargetHours = 16,
            EndedAt = new DateTimeOffset(2026, 5, 17, 15, 30, 0, TimeSpan.Zero),
        });
        // Ended early: 16h target, ran 9h.
        app.Db.FastingSessions.Add(new FastingSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            StartedAt = new DateTimeOffset(2026, 5, 18, 0, 0, 0, TimeSpan.Zero),
            TargetHours = 16,
            EndedAt = new DateTimeOffset(2026, 5, 18, 9, 0, 0, TimeSpan.Zero),
        });
        await app.Db.SaveChangesAsync();

        var list = await Handler(app, user.Id, clock).Handle(
            new ListFastsQuery(new DateOnly(2026, 5, 16), new DateOnly(2026, 5, 18)), default);

        list.Should().HaveCount(2);
        list[0].Outcome.Should().Be("Completed");
        list[1].Outcome.Should().Be("EndedEarly");
    }

    [Fact]
    public async Task A_fast_that_started_before_the_range_but_ended_inside_it_is_included()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);

        // Started Sunday 8:36pm Toronto (= Mon 00:36Z), ended Monday 1pm
        // Toronto (= Mon 17:00Z). Queried for Monday only, it must appear.
        app.Db.FastingSessions.Add(new FastingSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            StartedAt = new DateTimeOffset(2026, 5, 18, 0, 36, 0, TimeSpan.Zero),
            TargetHours = 16,
            EndedAt = new DateTimeOffset(2026, 5, 18, 17, 0, 0, TimeSpan.Zero),
        });
        await app.Db.SaveChangesAsync();

        var mondayOnly = await Handler(app, user.Id, clock).Handle(
            new ListFastsQuery(new DateOnly(2026, 5, 18), new DateOnly(2026, 5, 18)), default);
        var sundayOnly = await Handler(app, user.Id, clock).Handle(
            new ListFastsQuery(new DateOnly(2026, 5, 17), new DateOnly(2026, 5, 17)), default);
        var saturdayOnly = await Handler(app, user.Id, clock).Handle(
            new ListFastsQuery(new DateOnly(2026, 5, 16), new DateOnly(2026, 5, 16)), default);

        mondayOnly.Should().ContainSingle("it ended on Monday");
        sundayOnly.Should().ContainSingle("it started Sunday evening local time");
        saturdayOnly.Should().BeEmpty();
    }

    [Fact]
    public async Task Only_the_current_users_sessions_are_returned()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        var other = new User { Id = Guid.NewGuid(), Email = "o@example.com", NormalizedEmail = "o@example.com" };
        app.Db.Users.AddRange(user, other);
        app.Db.FastingSessions.Add(new FastingSession
        {
            Id = Guid.NewGuid(),
            UserId = other.Id,
            StartedAt = clock.UtcNow.AddHours(-5),
            TargetHours = 16,
        });
        await app.Db.SaveChangesAsync();

        var list = await Handler(app, user.Id, clock).Handle(
            new ListFastsQuery(new DateOnly(2026, 5, 11), new DateOnly(2026, 5, 18)), default);

        list.Should().BeEmpty();
    }
}
