using FluentAssertions;
using Shalom.Application.Auth;
using Shalom.Application.Exceptions;
using Shalom.Application.Tests.Support;
using Shalom.Domain.Entities;
using Shalom.Domain.Enums;
using Xunit;

namespace Shalom.Application.Tests.Auth;

public class GetCurrentUserQueryHandlerTests
{
    [Fact]
    public async Task Returns_current_user_when_authenticated()
    {
        await using var app = TestApp.Create();
        var userId = Guid.NewGuid();
        app.Db.Users.Add(new User
        {
            Id = userId,
            Email = "me@example.com",
            NormalizedEmail = "me@example.com",
            PasswordHash = "x",
            Role = UserRole.Admin,
        });
        await app.Db.SaveChangesAsync();

        var handler = new GetCurrentUserQueryHandler(
            app.Db, new StubCurrentUserAccessor { UserId = userId });
        var user = await handler.Handle(new GetCurrentUserQuery(), default);

        user.Id.Should().Be(userId);
        user.Email.Should().Be("me@example.com");
        user.Role.Should().Be(UserRole.Admin);
    }

    [Fact]
    public async Task Throws_invalid_credentials_when_not_authenticated()
    {
        await using var app = TestApp.Create();
        var handler = new GetCurrentUserQueryHandler(app.Db, new StubCurrentUserAccessor());

        var act = async () => await handler.Handle(new GetCurrentUserQuery(), default);

        await act.Should().ThrowAsync<InvalidCredentialsException>();
    }

    [Fact]
    public async Task Throws_invalid_credentials_when_user_no_longer_exists()
    {
        await using var app = TestApp.Create();
        var handler = new GetCurrentUserQueryHandler(
            app.Db, new StubCurrentUserAccessor { UserId = Guid.NewGuid() });

        var act = async () => await handler.Handle(new GetCurrentUserQuery(), default);

        await act.Should().ThrowAsync<InvalidCredentialsException>();
    }
}
