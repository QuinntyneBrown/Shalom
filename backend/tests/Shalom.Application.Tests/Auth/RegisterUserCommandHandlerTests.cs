using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Auth;
using Shalom.Application.Exceptions;
using Shalom.Application.Tests.Support;
using Shalom.Domain.Enums;
using Xunit;

namespace Shalom.Application.Tests.Auth;

public class RegisterUserCommandHandlerTests
{
    private static RegisterUserCommandHandler CreateHandler(TestApp app, StubDateTimeProvider? clock = null)
        => new(app.Db, new StubPasswordHasher(), new StubJwtTokenService(), clock ?? new StubDateTimeProvider());

    [Fact]
    public async Task Register_creates_user_with_refresh_and_verification_tokens()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var handler = CreateHandler(app, clock);

        var result = await handler.Handle(
            new RegisterUserCommand("Fresh@Example.com", "password123"), default);

        result.User.Email.Should().Be("Fresh@Example.com");
        result.User.Role.Should().Be(UserRole.User);
        result.User.EmailVerifiedUtc.Should().BeNull();
        result.Token.AccessToken.Should().NotBeNullOrEmpty();
        result.Token.RefreshToken.Should().NotBeNullOrEmpty();

        var user = await app.Db.Users.SingleAsync();
        user.NormalizedEmail.Should().Be("fresh@example.com");
        user.PasswordHash.Should().NotBe("password123");
        user.CreatedAtUtc.Should().Be(clock.UtcNow);

        (await app.Db.RefreshTokens.CountAsync(t => t.UserId == user.Id)).Should().Be(1);
        (await app.Db.EmailVerificationTokens.CountAsync(t => t.UserId == user.Id)).Should().Be(1);
    }

    [Fact]
    public async Task Register_with_duplicate_email_throws_email_in_use_conflict()
    {
        await using var app = TestApp.Create();
        var handler = CreateHandler(app);

        await handler.Handle(new RegisterUserCommand("dup@example.com", "password123"), default);
        var act = async () => await handler.Handle(
            new RegisterUserCommand("DUP@example.com", "password123"), default);

        (await act.Should().ThrowAsync<ConflictException>())
            .Which.Code.Should().Be("email_in_use");
    }

    [Fact]
    public void Validator_rejects_invalid_email_and_short_password()
    {
        var validator = new RegisterUserCommandValidator();

        validator.Validate(new RegisterUserCommand("not-an-email", "password123"))
            .IsValid.Should().BeFalse();
        validator.Validate(new RegisterUserCommand("ok@example.com", "short"))
            .IsValid.Should().BeFalse();
        validator.Validate(new RegisterUserCommand("ok@example.com", "password123"))
            .IsValid.Should().BeTrue();
    }
}
