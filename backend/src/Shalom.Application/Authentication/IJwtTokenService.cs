using Shalom.Domain.Entities;

namespace Shalom.Application.Authentication;

public interface IJwtTokenService
{
    string CreateAccessToken(User user);
    DateTimeOffset AccessTokenExpiresAt { get; }
    string CreateRawRefreshToken();
    string HashRefreshToken(string raw);
}
