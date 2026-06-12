using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Exceptions;
using Shalom.Application.Meals;
using Shalom.Application.Tests.Support;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.Meals;

public class LogMealCommandHandlerTests
{
    private static User NewUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "quinn@example.com",
        NormalizedEmail = "quinn@example.com",
    };

    [Fact]
    public async Task Logs_a_meal_with_comma_joined_tags_at_utc_now()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var handler = new LogMealCommandHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id }, clock);
        var dto = await handler.Handle(new LogMealCommand("salmon + greens", ["home-cooked", "fish"]), default);

        dto.Text.Should().Be("salmon + greens");
        dto.Tags.Should().Equal("home-cooked", "fish");
        dto.OccurredAt.Should().Be(clock.UtcNow);

        var stored = await app.Db.MealEntries.SingleAsync();
        stored.UserId.Should().Be(user.Id);
        stored.Tags.Should().Be("home-cooked,fish");
        stored.CreatedAt.Should().Be(clock.UtcNow);
    }

    [Fact]
    public async Task An_untagged_meal_stores_an_empty_tag_string()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var handler = new LogMealCommandHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id }, clock);
        var dto = await handler.Handle(new LogMealCommand("toast", []), default);

        dto.Tags.Should().BeEmpty();
        (await app.Db.MealEntries.SingleAsync()).Tags.Should().BeEmpty();
    }

    [Fact]
    public async Task Without_an_authenticated_user_throws_invalid_credentials()
    {
        await using var app = TestApp.Create();
        var handler = new LogMealCommandHandler(app.Db, new StubCurrentUserAccessor(), new StubDateTimeProvider());

        var act = async () => await handler.Handle(new LogMealCommand("toast", []), default);

        await act.Should().ThrowAsync<InvalidCredentialsException>();
    }
}
