using Shalom.Application.Authentication;
using Shalom.Domain.Entities;

namespace Shalom.Application.Tests.Support;

internal sealed class StubJwtTokenService : IJwtTokenService
{
    private int _counter;

    public DateTimeOffset AccessTokenExpiresAt { get; set; } =
        new(2026, 5, 18, 12, 15, 0, TimeSpan.Zero);

    public string CreateAccessToken(User user) => $"access-{user.Id:N}";

    public string CreateRawRefreshToken() => $"refresh-{Interlocked.Increment(ref _counter)}";

    public string HashRefreshToken(string raw) => $"hash::{raw}";
}
