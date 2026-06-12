using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace Shalom.Api.Tests.Support;

/// <summary>Shared plumbing for endpoint tests that need an authenticated client.</summary>
public static class ApiTestExtensions
{
    private record TokenDto(string AccessToken, string RefreshToken, DateTimeOffset AccessTokenExpiresAtUtc, string TokenType);
    private record UserDto(Guid Id, string Email, string Role, DateTimeOffset? EmailVerifiedUtc);
    private record AuthSuccessDto(TokenDto Token, UserDto User);

    /// <summary>Registers a fresh user and returns a client carrying its bearer token.</summary>
    public static async Task<HttpClient> CreateAuthenticatedClientAsync(this ShalomApiFactory factory, string? email = null)
    {
        var client = factory.CreateClient();
        email ??= $"user-{Guid.NewGuid():N}@example.com";

        var res = await client.PostAsJsonAsync("/api/auth/register", new { email, password = "password123" });
        res.EnsureSuccessStatusCode();

        var body = await res.Content.ReadFromJsonAsync<AuthSuccessDto>()
            ?? throw new InvalidOperationException("Register returned no body.");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", body.Token.AccessToken);
        return client;
    }
}
