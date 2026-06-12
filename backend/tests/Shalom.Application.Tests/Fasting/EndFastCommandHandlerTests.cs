using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Exceptions;
using Shalom.Application.Fasting;
using Shalom.Application.Tests.Support;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.Fasting;

public class EndFastCommandHandlerTests
{
    private static User NewUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "quinn@example.com",
        NormalizedEmail = "quinn@example.com",
    };

    private static EndFastCommandHandler Handler(TestApp app, Guid userId, StubDateTimeProvider clock) =>
        new(app.Db, new StubCurrentUserAccessor { UserId = userId }, clock);

    private static FastingSession OpenSession(Guid userId, DateTimeOffset startedAt, int targetHours = 16) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        StartedAt = startedAt,
        TargetHours = targetHours,
    };

    [Fact]
    public async Task Ending_after_the_target_derives_completed()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        app.Db.FastingSessions.Add(OpenSession(user.Id, clock.UtcNow.AddHours(-17)));
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new EndFastCommand(), default);

        dto.EndedAt.Should().Be(clock.UtcNow);
        dto.Outcome.Should().Be("Completed");
        dto.ElapsedHours.Should().BeApproximately(17, 0.01);

        var stored = await app.Db.FastingSessions.SingleAsync();
        stored.EndedAt.Should().Be(clock.UtcNow);
    }

    [Fact]
    public async Task Ending_before_the_target_derives_ended_early()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        app.Db.FastingSessions.Add(OpenSession(user.Id, clock.UtcNow.AddHours(-10)));
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new EndFastCommand(), default);

        dto.Outcome.Should().Be("EndedEarly");
        dto.ElapsedHours.Should().BeApproximately(10, 0.01);
    }

    [Fact]
    public async Task Reaching_exactly_the_target_counts_as_completed()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        app.Db.FastingSessions.Add(OpenSession(user.Id, clock.UtcNow.AddHours(-16)));
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new EndFastCommand(), default);

        dto.Outcome.Should().Be("Completed");
    }

    [Fact]
    public async Task Ending_with_no_open_fast_throws_not_found()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        // An already-ended session must not be "re-ended".
        var ended = OpenSession(user.Id, clock.UtcNow.AddHours(-30));
        ended.EndedAt = clock.UtcNow.AddHours(-10);
        app.Db.FastingSessions.Add(ended);
        await app.Db.SaveChangesAsync();

        var act = async () => await Handler(app, user.Id, clock).Handle(new EndFastCommand(), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Without_an_authenticated_user_throws_invalid_credentials()
    {
        await using var app = TestApp.Create();
        var handler = new EndFastCommandHandler(
            app.Db, new StubCurrentUserAccessor(), new StubDateTimeProvider());

        var act = async () => await handler.Handle(new EndFastCommand(), default);

        await act.Should().ThrowAsync<InvalidCredentialsException>();
    }
}
