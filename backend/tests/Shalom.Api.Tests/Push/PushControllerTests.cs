using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Shalom.Api.Tests.Support;
using Shalom.Infrastructure.Persistence;
using Xunit;

namespace Shalom.Api.Tests.Push;

public class PushControllerTests : IClassFixture<ShalomApiFactory>
{
    private readonly ShalomApiFactory _factory;
    public PushControllerTests(ShalomApiFactory factory) { _factory = factory; }

    private record VapidDto(string PublicKey);

    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(_factory.ConnectionString)
            .Options;
        return new AppDbContext(options);
    }

    private static object SubscribeBody(string endpoint) => new
    {
        endpoint,
        p256dh = "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
        auth = "tBHItJI5svbpez7KI4CCXg",
    };

    [Fact]
    public async Task Push_endpoints_without_bearer_return_401()
    {
        var client = _factory.CreateClient();

        var post = await client.PostAsJsonAsync("/api/push/subscribe", SubscribeBody("https://push.example.com/x"));
        post.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var delete = await client.SendAsync(new HttpRequestMessage(HttpMethod.Delete, "/api/push/subscribe")
        {
            Content = JsonContent.Create(new { endpoint = "https://push.example.com/x" }),
        });
        delete.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Vapid_public_key_is_anonymous_safe()
    {
        var client = _factory.CreateClient(); // NO bearer on purpose

        var dto = await client.GetFromJsonAsync<VapidDto>("/api/push/vapid-public-key");

        dto!.PublicKey.Should().Be("test-vapid-public-key");
    }

    [Fact]
    public async Task Subscribe_stores_then_upserts_then_unsubscribe_removes()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var endpoint = $"https://push.example.com/send/{Guid.NewGuid():N}";

        // Subscribe → 204 + one row.
        var first = await client.PostAsJsonAsync("/api/push/subscribe", SubscribeBody(endpoint));
        first.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Same endpoint again (rotated keys) → still ONE row, keys refreshed.
        var second = await client.PostAsJsonAsync("/api/push/subscribe", new
        {
            endpoint,
            p256dh = "rotated-p256dh",
            auth = "rotated-auth",
        });
        second.StatusCode.Should().Be(HttpStatusCode.NoContent);

        await using (var db = CreateDbContext())
        {
            var rows = await db.PushSubscriptions.Where(s => s.Endpoint == endpoint).ToListAsync();
            rows.Should().ContainSingle().Which.P256dh.Should().Be("rotated-p256dh");
        }

        // Unsubscribe (endpoint in the body) → 204 + row gone.
        var delete = await client.SendAsync(new HttpRequestMessage(HttpMethod.Delete, "/api/push/subscribe")
        {
            Content = JsonContent.Create(new { endpoint }),
        });
        delete.StatusCode.Should().Be(HttpStatusCode.NoContent);

        await using (var db = CreateDbContext())
        {
            (await db.PushSubscriptions.AnyAsync(s => s.Endpoint == endpoint)).Should().BeFalse();
        }

        // Idempotent: deleting it again is still 204.
        var deleteAgain = await client.SendAsync(new HttpRequestMessage(HttpMethod.Delete, "/api/push/subscribe")
        {
            Content = JsonContent.Create(new { endpoint }),
        });
        deleteAgain.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Subscribe_with_a_non_https_endpoint_returns_400()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();

        var res = await client.PostAsJsonAsync("/api/push/subscribe", SubscribeBody("http://insecure.example.com/x"));

        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Subscribe_with_missing_keys_returns_400()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();

        var res = await client.PostAsJsonAsync("/api/push/subscribe", new
        {
            endpoint = "https://push.example.com/x",
            p256dh = "",
            auth = "",
        });

        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
