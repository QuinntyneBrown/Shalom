using FluentAssertions;
using Shalom.Application.Tests.Support;
using Shalom.Application.Workouts;
using Shalom.Domain.Entities;
using Shalom.Domain.Enums;
using Xunit;

namespace Shalom.Application.Tests.Workouts;

public class ListWorkoutsQueryHandlerTests
{
    private static User NewUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "quinn@example.com",
        NormalizedEmail = "quinn@example.com",
    };

    private static Workout At(Guid userId, DateTimeOffset startedAt, EquipmentType equipment = EquipmentType.IndoorBike) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Equipment = equipment,
        StartedAt = startedAt,
        DurationMinutes = 25,
        CreatedAt = startedAt,
    };

    [Fact]
    public async Task Filters_by_local_day_and_returns_newest_first()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider(); // 2026-05-18 12:00Z (Monday 08:00 in Toronto)
        var user = NewUser();
        app.Db.Users.Add(user);

        // Sunday 21:00 local = Monday 01:00Z — belongs to Sunday, not Monday.
        app.Db.Workouts.Add(At(user.Id, new DateTimeOffset(2026, 5, 18, 1, 0, 0, TimeSpan.Zero), EquipmentType.Treadmill));
        // Monday 07:30 local.
        app.Db.Workouts.Add(At(user.Id, new DateTimeOffset(2026, 5, 18, 11, 30, 0, TimeSpan.Zero)));
        await app.Db.SaveChangesAsync();

        var handler = new ListWorkoutsQueryHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id });

        var monday = await handler.Handle(
            new ListWorkoutsQuery(new DateOnly(2026, 5, 18), new DateOnly(2026, 5, 18)), default);
        var week = await handler.Handle(
            new ListWorkoutsQuery(new DateOnly(2026, 5, 17), new DateOnly(2026, 5, 18)), default);

        monday.Should().ContainSingle().Which.Equipment.Should().Be(EquipmentType.IndoorBike);
        week.Should().HaveCount(2);
        week[0].Equipment.Should().Be(EquipmentType.IndoorBike, "newest first");
    }

    [Fact]
    public async Task Only_the_current_users_workouts_are_returned()
    {
        await using var app = TestApp.Create();
        var user = NewUser();
        var other = new User { Id = Guid.NewGuid(), Email = "o@example.com", NormalizedEmail = "o@example.com" };
        app.Db.Users.AddRange(user, other);
        app.Db.Workouts.Add(At(other.Id, new DateTimeOffset(2026, 5, 18, 11, 0, 0, TimeSpan.Zero)));
        await app.Db.SaveChangesAsync();

        var handler = new ListWorkoutsQueryHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id });
        var list = await handler.Handle(
            new ListWorkoutsQuery(new DateOnly(2026, 5, 11), new DateOnly(2026, 5, 18)), default);

        list.Should().BeEmpty();
    }
}
