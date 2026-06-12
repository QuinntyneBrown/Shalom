using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Auth;
using Shalom.Application.Exceptions;
using Shalom.Application.Tests.Support;
using Shalom.Domain.Entities;
using Shalom.Domain.Enums;
using Xunit;

namespace Shalom.Application.Tests.Auth;

public class LoginCommandHandlerTests
{
    [Fact]
    public async Task Login_with_correct_credentials_returns_tokens_and_stores_refresh_token()
    {
        await using var app = TestApp.Create();
        var hasher = new StubPasswordHasher();
        var jwt = new StubJwtTokenService();
        var clock = new StubDateTimeProvider();

        app.Db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = "Quinn@Example.com",
            NormalizedEmail = "quinn@example.com",
            PasswordHash = hasher.Hash("password123"),
            Role = UserRole.User,
            CreatedAtUtc = clock.UtcNow,
            UpdatedAtUtc = clock.UtcNow,
        });
        await app.Db.SaveChangesAsync();

        var handler = new LoginCommandHandler(app.Db, hasher, jwt, clock);
        var result = await handler.Handle(new LoginCommand("quinn@example.com", "password123"), default);

        result.Token.AccessToken.Should().NotBeNullOrEmpty();
        result.Token.RefreshToken.Should().NotBeNullOrEmpty();
        result.User.Email.Should().Be("Quinn@Example.com");

        var stored = await app.Db.RefreshTokens.SingleAsync();
        stored.TokenHash.Should().Be(jwt.HashRefreshToken(result.Token.RefreshToken));
        stored.ExpiresAtUtc.Should().Be(clock.UtcNow.AddDays(14));
    }

    [Fact]
    public async Task Login_trims_and_lowercases_email_before_lookup()
    {
        await using var app = TestApp.Create();
        var hasher = new StubPasswordHasher();

        app.Db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = "quinn@example.com",
            NormalizedEmail = "quinn@example.com",
            PasswordHash = hasher.Hash("password123"),
        });
        await app.Db.SaveChangesAsync();

        var handler = new LoginCommandHandler(app.Db, hasher, new StubJwtTokenService(), new StubDateTimeProvider());
        var result = await handler.Handle(new LoginCommand("  QUINN@example.COM ", "password123"), default);

        result.User.Email.Should().Be("quinn@example.com");
    }

    [Fact]
    public async Task Login_with_wrong_password_throws_invalid_credentials()
    {
        await using var app = TestApp.Create();
        var hasher = new StubPasswordHasher();

        app.Db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = "quinn@example.com",
            NormalizedEmail = "quinn@example.com",
            PasswordHash = hasher.Hash("password123"),
        });
        await app.Db.SaveChangesAsync();

        var handler = new LoginCommandHandler(app.Db, hasher, new StubJwtTokenService(), new StubDateTimeProvider());
        var act = async () => await handler.Handle(new LoginCommand("quinn@example.com", "wrong-password"), default);

        await act.Should().ThrowAsync<InvalidCredentialsException>();
    }

    [Fact]
    public async Task Login_with_unknown_email_throws_invalid_credentials()
    {
        await using var app = TestApp.Create();
        var handler = new LoginCommandHandler(
            app.Db, new StubPasswordHasher(), new StubJwtTokenService(), new StubDateTimeProvider());

        var act = async () => await handler.Handle(new LoginCommand("nobody@example.com", "any-password"), default);

        await act.Should().ThrowAsync<InvalidCredentialsException>();
    }
}
