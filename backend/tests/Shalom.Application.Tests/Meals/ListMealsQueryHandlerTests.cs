using FluentAssertions;
using Shalom.Application.Meals;
using Shalom.Application.Tests.Support;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.Meals;

public class ListMealsQueryHandlerTests
{
    private static User NewUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "quinn@example.com",
        NormalizedEmail = "quinn@example.com",
    };

    private static MealEntry At(Guid userId, DateTimeOffset occurredAt, string text = "salmon + greens") => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Text = text,
        Tags = "home-cooked",
        OccurredAt = occurredAt,
        CreatedAt = occurredAt,
    };

    [Fact]
    public async Task Filters_by_local_day_and_returns_newest_first()
    {
        await using var app = TestApp.Create();
        var user = NewUser();
        app.Db.Users.Add(user);

        // Sunday 21:30 local = Monday 01:30Z — a late-night Sunday meal.
        app.Db.MealEntries.Add(At(user.Id, new DateTimeOffset(2026, 5, 18, 1, 30, 0, TimeSpan.Zero), "late ramen"));
        // Monday 12:30 local.
        app.Db.MealEntries.Add(At(user.Id, new DateTimeOffset(2026, 5, 18, 16, 30, 0, TimeSpan.Zero), "salad"));
        await app.Db.SaveChangesAsync();

        var handler = new ListMealsQueryHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id });

        var monday = await handler.Handle(
            new ListMealsQuery(new DateOnly(2026, 5, 18), new DateOnly(2026, 5, 18)), default);
        var both = await handler.Handle(
            new ListMealsQuery(new DateOnly(2026, 5, 17), new DateOnly(2026, 5, 18)), default);

        monday.Should().ContainSingle().Which.Text.Should().Be("salad");
        both.Should().HaveCount(2);
        both[0].Text.Should().Be("salad", "newest first");
        both[0].Tags.Should().Equal("home-cooked");
    }
}
