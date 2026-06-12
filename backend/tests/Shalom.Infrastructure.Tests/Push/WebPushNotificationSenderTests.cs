using System.Net;
using System.Security.Cryptography;
using System.Text.Json;
using FluentAssertions;
using Lib.Net.Http.WebPush;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Shalom.Application.Common;
using Shalom.Application.Push;
using Shalom.Domain.Entities;
using Shalom.Infrastructure.Push;
using Shalom.Infrastructure.Tests.Support;
using Xunit;
using PushSubscription = Shalom.Domain.Entities.PushSubscription;

namespace Shalom.Infrastructure.Tests.Push;

/// <summary>
/// Subscription hygiene of the Web Push sender against a real database and
/// a stubbed push service: 410/404 prune immediately, transient failures
/// bump FailedCount (prune at 5), success resets the counter. Keys are real
/// P-256 material because the library encrypts the payload BEFORE talking
/// HTTP — garbage keys would fail client-side and never exercise the
/// status-code paths.
/// </summary>
public class WebPushNotificationSenderTests : IAsyncLifetime
{
    private TestDatabase _db = null!;

    public async Task InitializeAsync() => _db = await TestDatabase.CreateAsync();
    public async Task DisposeAsync() => await _db.DisposeAsync();

    private static readonly ReminderNotification Notification =
        new("Shalom", "Your window is open — break your fast well.", "/today", "window-open");

    private sealed class StubClock : IDateTimeProvider
    {
        public DateTimeOffset UtcNow { get; } = new(2026, 6, 12, 16, 0, 0, TimeSpan.Zero);
        public DateOnly Today => DateOnly.FromDateTime(UtcNow.UtcDateTime);
    }

    private sealed class StubPushServiceHandler : HttpMessageHandler
    {
        public HttpStatusCode StatusCode { get; set; } = HttpStatusCode.Created;
        public int Requests { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests++;
            return Task.FromResult(new HttpResponseMessage(StatusCode));
        }
    }

    private static (string PublicKey, string PrivateKey) GenerateVapidKeys()
    {
        using var ec = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        var p = ec.ExportParameters(true);
        return (Base64UrlEncoder.Encode(UncompressedPoint(p)), Base64UrlEncoder.Encode(p.D!));
    }

    private static (string P256dh, string Auth) GenerateClientKeys()
    {
        using var ec = ECDiffieHellman.Create(ECCurve.NamedCurves.nistP256);
        var p = ec.ExportParameters(false);
        return (
            Base64UrlEncoder.Encode(UncompressedPoint(p)),
            Base64UrlEncoder.Encode(RandomNumberGenerator.GetBytes(16)));
    }

    private static byte[] UncompressedPoint(ECParameters p)
    {
        var point = new byte[65];
        point[0] = 0x04;
        Buffer.BlockCopy(p.Q.X!, 0, point, 1, 32);
        Buffer.BlockCopy(p.Q.Y!, 0, point, 33, 32);
        return point;
    }

    private static WebPushNotificationSender CreateSender(
        Shalom.Infrastructure.Persistence.AppDbContext ctx, StubPushServiceHandler handler)
    {
        var (publicKey, privateKey) = GenerateVapidKeys();
        var options = Options.Create(new PushOptions { PublicKey = publicKey, PrivateKey = privateKey });
        return new WebPushNotificationSender(
            new PushServiceClient(new HttpClient(handler)),
            ctx,
            new StubClock(),
            options,
            NullLogger<WebPushNotificationSender>.Instance);
    }

    private async Task<PushSubscription> SeedSubscriptionAsync(int failedCount = 0)
    {
        var (p256dh, auth) = GenerateClientKeys();
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = $"u-{Guid.NewGuid():N}@example.com",
            NormalizedEmail = $"u-{Guid.NewGuid():N}@example.com",
            PasswordHash = "h",
        };
        var subscription = new PushSubscription
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Endpoint = $"https://push.example.com/send/{Guid.NewGuid():N}",
            P256dh = p256dh,
            Auth = auth,
            CreatedAt = DateTimeOffset.UtcNow,
            FailedCount = failedCount,
        };

        await using var ctx = _db.CreateContext();
        ctx.Users.Add(user);
        ctx.PushSubscriptions.Add(subscription);
        await ctx.SaveChangesAsync();
        return subscription;
    }

    [Fact]
    public async Task Success_delivers_resets_FailedCount_and_stamps_LastSeenAt()
    {
        var seeded = await SeedSubscriptionAsync(failedCount: 3);
        var handler = new StubPushServiceHandler { StatusCode = HttpStatusCode.Created };

        await using (var ctx = _db.CreateContext())
        {
            await CreateSender(ctx, handler).SendToAllAsync(Notification);
        }

        handler.Requests.Should().Be(1);
        await using var read = _db.CreateContext();
        var row = await read.PushSubscriptions.SingleAsync(s => s.Id == seeded.Id);
        row.FailedCount.Should().Be(0);
        row.LastSeenAt.Should().Be(new StubClock().UtcNow);
    }

    [Theory]
    [InlineData(HttpStatusCode.Gone)]
    [InlineData(HttpStatusCode.NotFound)]
    public async Task Gone_and_NotFound_prune_the_subscription_immediately(HttpStatusCode statusCode)
    {
        var seeded = await SeedSubscriptionAsync();
        var handler = new StubPushServiceHandler { StatusCode = statusCode };

        await using (var ctx = _db.CreateContext())
        {
            await CreateSender(ctx, handler).SendToAllAsync(Notification);
        }

        await using var read = _db.CreateContext();
        (await read.PushSubscriptions.AnyAsync(s => s.Id == seeded.Id)).Should().BeFalse();
    }

    [Fact]
    public async Task Transient_failure_bumps_FailedCount_but_keeps_the_subscription()
    {
        var seeded = await SeedSubscriptionAsync();
        var handler = new StubPushServiceHandler { StatusCode = HttpStatusCode.InternalServerError };

        await using (var ctx = _db.CreateContext())
        {
            await CreateSender(ctx, handler).SendToAllAsync(Notification);
        }

        await using var read = _db.CreateContext();
        var row = await read.PushSubscriptions.SingleAsync(s => s.Id == seeded.Id);
        row.FailedCount.Should().Be(1);
    }

    [Fact]
    public async Task Fifth_consecutive_failure_prunes_the_subscription()
    {
        var seeded = await SeedSubscriptionAsync(failedCount: 4);
        var handler = new StubPushServiceHandler { StatusCode = HttpStatusCode.InternalServerError };

        await using (var ctx = _db.CreateContext())
        {
            await CreateSender(ctx, handler).SendToAllAsync(Notification);
        }

        await using var read = _db.CreateContext();
        (await read.PushSubscriptions.AnyAsync(s => s.Id == seeded.Id)).Should().BeFalse();
    }

    [Fact]
    public async Task Without_vapid_keys_the_sender_is_a_silent_noop()
    {
        await SeedSubscriptionAsync();
        var handler = new StubPushServiceHandler();

        await using (var ctx = _db.CreateContext())
        {
            var sender = new WebPushNotificationSender(
                new PushServiceClient(new HttpClient(handler)),
                ctx,
                new StubClock(),
                Options.Create(new PushOptions()),
                NullLogger<WebPushNotificationSender>.Instance);
            await sender.SendToAllAsync(Notification);
        }

        handler.Requests.Should().Be(0);
    }

    [Fact]
    public void Payload_is_the_exact_ngsw_notification_shape()
    {
        var json = WebPushNotificationSender.BuildNgswPayload(Notification);

        using var doc = JsonDocument.Parse(json);
        var n = doc.RootElement.GetProperty("notification");
        n.GetProperty("title").GetString().Should().Be("Shalom");
        n.GetProperty("body").GetString().Should().Be("Your window is open — break your fast well.");
        n.GetProperty("icon").GetString().Should().Be("icons/icon-192.png");
        n.GetProperty("tag").GetString().Should().Be("window-open");
        var data = n.GetProperty("data");
        data.GetProperty("url").GetString().Should().Be("/today");
        var click = data.GetProperty("onActionClick").GetProperty("default");
        click.GetProperty("operation").GetString().Should().Be("focusLastFocusedOrOpen");
        click.GetProperty("url").GetString().Should().Be("/today");
    }

    [Fact]
    public async Task PushSendLog_unique_index_rejects_a_second_send_of_the_same_kind_and_day()
    {
        // The scheduler's at-most-once guarantee lives in the database, not
        // in process memory — restarts and racing ticks both hit this index.
        await using var ctx = _db.CreateContext();
        ctx.PushSendLogs.Add(new PushSendLog
        {
            Id = Guid.NewGuid(),
            Kind = "window-open",
            Date = new DateOnly(2026, 6, 12),
            SentAt = DateTimeOffset.UtcNow,
        });
        await ctx.SaveChangesAsync();

        ctx.PushSendLogs.Add(new PushSendLog
        {
            Id = Guid.NewGuid(),
            Kind = "window-open",
            Date = new DateOnly(2026, 6, 12),
            SentAt = DateTimeOffset.UtcNow,
        });
        var act = async () => await ctx.SaveChangesAsync();

        await act.Should().ThrowAsync<DbUpdateException>();
    }
}
