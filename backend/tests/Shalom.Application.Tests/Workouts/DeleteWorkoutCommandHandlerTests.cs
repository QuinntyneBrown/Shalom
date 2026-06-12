using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Exceptions;
using Shalom.Application.Tests.Support;
using Shalom.Application.Workouts;
using Shalom.Domain.Entities;
using Shalom.Domain.Enums;
using Xunit;

namespace Shalom.Application.Tests.Workouts;

public class DeleteWorkoutCommandHandlerTests
{
    private static User NewUser(string email = "quinn@example.com") => new()
    {
        Id = Guid.NewGuid(),
        Email = email,
        NormalizedEmail = email,
    };

    private static Workout For(Guid userId) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Equipment = EquipmentType.IndoorBike,
        StartedAt = new DateTimeOffset(2026, 5, 18, 11, 0, 0, TimeSpan.Zero),
        DurationMinutes = 25,
    };

    [Fact]
    public async Task Deletes_the_users_workout()
    {
        await using var app = TestApp.Create();
        var user = NewUser();
        var workout = For(user.Id);
        app.Db.Users.Add(user);
        app.Db.Workouts.Add(workout);
        await app.Db.SaveChangesAsync();

        var handler = new DeleteWorkoutCommandHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id });
        await handler.Handle(new DeleteWorkoutCommand(workout.Id), default);

        (await app.Db.Workouts.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task A_missing_id_throws_not_found()
    {
        await using var app = TestApp.Create();
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var handler = new DeleteWorkoutCommandHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id });
        var act = async () => await handler.Handle(new DeleteWorkoutCommand(Guid.NewGuid()), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Someone_elses_workout_reads_as_not_found()
    {
        await using var app = TestApp.Create();
        var user = NewUser();
        var other = NewUser("other@example.com");
        var workout = For(other.Id);
        app.Db.Users.AddRange(user, other);
        app.Db.Workouts.Add(workout);
        await app.Db.SaveChangesAsync();

        var handler = new DeleteWorkoutCommandHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id });
        var act = async () => await handler.Handle(new DeleteWorkoutCommand(workout.Id), default);

        await act.Should().ThrowAsync<NotFoundException>();
        (await app.Db.Workouts.CountAsync()).Should().Be(1, "the other user's row must survive");
    }
}
