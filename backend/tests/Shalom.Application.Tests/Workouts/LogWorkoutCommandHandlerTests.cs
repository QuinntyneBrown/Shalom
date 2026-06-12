using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Exceptions;
using Shalom.Application.Tests.Support;
using Shalom.Application.Workouts;
using Shalom.Domain.Entities;
using Shalom.Domain.Enums;
using Xunit;

namespace Shalom.Application.Tests.Workouts;

public class LogWorkoutCommandHandlerTests
{
    private static User NewUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "quinn@example.com",
        NormalizedEmail = "quinn@example.com",
    };

    private static LogWorkoutCommandHandler Handler(TestApp app, Guid userId, StubDateTimeProvider clock) =>
        new(app.Db, new StubCurrentUserAccessor { UserId = userId }, clock);

    [Fact]
    public async Task Logs_a_workout_defaulting_started_at_to_now()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(
            new LogWorkoutCommand(EquipmentType.IndoorBike, 25, Notes: "effort:steady"), default);

        dto.Equipment.Should().Be(EquipmentType.IndoorBike);
        dto.DurationMinutes.Should().Be(25);
        dto.StartedAt.Should().Be(clock.UtcNow);
        dto.Notes.Should().Be("effort:steady");

        var stored = await app.Db.Workouts.SingleAsync();
        stored.UserId.Should().Be(user.Id);
        stored.CreatedAt.Should().Be(clock.UtcNow);
    }

    [Fact]
    public async Task An_explicit_started_at_is_kept()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var startedAt = clock.UtcNow.AddHours(-3);
        var dto = await Handler(app, user.Id, clock).Handle(
            new LogWorkoutCommand(EquipmentType.Treadmill, 31, startedAt, 4.2m, 138, 250), default);

        dto.StartedAt.Should().Be(startedAt);
        dto.DistanceKm.Should().Be(4.2m);
        dto.AvgHeartRateBpm.Should().Be(138);
        dto.ActiveCalories.Should().Be(250);
    }

    [Fact]
    public async Task Without_an_authenticated_user_throws_invalid_credentials()
    {
        await using var app = TestApp.Create();
        var handler = new LogWorkoutCommandHandler(
            app.Db, new StubCurrentUserAccessor(), new StubDateTimeProvider());

        var act = async () => await handler.Handle(new LogWorkoutCommand(EquipmentType.Elliptical, 20), default);

        await act.Should().ThrowAsync<InvalidCredentialsException>();
    }
}
