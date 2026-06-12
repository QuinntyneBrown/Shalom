using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Exceptions;
using Shalom.Application.Push;
using Shalom.Application.Tests.Support;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.Push;

public class PushSubscriptionHandlerTests
{
    private const string Endpoint = "https://push.example.com/send/abc123";

    private static User NewUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "quinn@example.com",
        NormalizedEmail = "quinn@example.com",
    };

    [Fact]
    public async Task Subscribe_inserts_a_fresh_subscription()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var handler = new SubscribeCommandHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id }, clock);
        await handler.Handle(new SubscribeCommand(Endpoint, "p256dh-key", "auth-key"), default);

        var row = await app.Db.PushSubscriptions.SingleAsync();
        row.UserId.Should().Be(user.Id);
        row.Endpoint.Should().Be(Endpoint);
        row.P256dh.Should().Be("p256dh-key");
        row.Auth.Should().Be("auth-key");
        row.CreatedAt.Should().Be(clock.UtcNow);
        row.LastSeenAt.Should().Be(clock.UtcNow);
        row.FailedCount.Should().Be(0);
    }

    [Fact]
    public async Task Subscribe_upserts_by_endpoint_refreshing_keys_and_forgiving_failures()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        app.Db.PushSubscriptions.Add(new PushSubscription
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Endpoint = Endpoint,
            P256dh = "old-p256dh",
            Auth = "old-auth",
            CreatedAt = clock.UtcNow.AddDays(-30),
            LastSeenAt = null,
            FailedCount = 4,
        });
        await app.Db.SaveChangesAsync();

        var handler = new SubscribeCommandHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id }, clock);
        await handler.Handle(new SubscribeCommand(Endpoint, "new-p256dh", "new-auth"), default);

        var row = await app.Db.PushSubscriptions.SingleAsync(); // still ONE row
        row.P256dh.Should().Be("new-p256dh");
        row.Auth.Should().Be("new-auth");
        row.LastSeenAt.Should().Be(clock.UtcNow);
        row.FailedCount.Should().Be(0);
        row.CreatedAt.Should().Be(clock.UtcNow.AddDays(-30)); // original birth date kept
    }

    [Fact]
    public async Task Subscribe_without_a_user_reads_as_invalid_credentials()
    {
        await using var app = TestApp.Create();
        var handler = new SubscribeCommandHandler(app.Db, new StubCurrentUserAccessor(), new StubDateTimeProvider());

        var act = async () => await handler.Handle(new SubscribeCommand(Endpoint, "p", "a"), default);

        await act.Should().ThrowAsync<InvalidCredentialsException>();
    }

    [Fact]
    public async Task Unsubscribe_removes_the_row()
    {
        await using var app = TestApp.Create();
        var user = NewUser();
        app.Db.Users.Add(user);
        app.Db.PushSubscriptions.Add(new PushSubscription
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Endpoint = Endpoint,
            P256dh = "p",
            Auth = "a",
        });
        await app.Db.SaveChangesAsync();

        var handler = new UnsubscribeCommandHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id });
        await handler.Handle(new UnsubscribeCommand(Endpoint), default);

        (await app.Db.PushSubscriptions.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Unsubscribe_an_unknown_endpoint_is_quietly_idempotent()
    {
        await using var app = TestApp.Create();
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var handler = new UnsubscribeCommandHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id });
        var act = async () => await handler.Handle(new UnsubscribeCommand(Endpoint), default);

        await act.Should().NotThrowAsync();
    }
}
