using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Common;
using Shalom.Application.Tests.Support;
using Shalom.Application.Today;
using Shalom.Domain.Entities;
using Shalom.Domain.Enums;
using Xunit;

namespace Shalom.Application.Tests.Today;

/// <summary>
/// The health half of the Today aggregate: fasting window math (including
/// the after-8pm seam where UTC is already tomorrow), today's workouts,
/// last meal, and the fasting/movement streaks.
/// </summary>
public class GetTodayQueryHandlerHealthTests
{
    private static User NewUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "quinn@example.com",
        NormalizedEmail = "quinn@example.com",
    };

    private static VerseOfDay Verse(int dayOfYear) => new()
    {
        Id = Guid.NewGuid(),
        DayOfYear = dayOfYear,
        Reference = "John 3:16",
        Text = "For God so loved the world...",
        YouVersionUrl = "https://www.bible.com/bible/111/JHN.3.16",
    };

    private static GetTodayQueryHandler Handler(TestApp app, Guid userId, StubDateTimeProvider clock) =>
        new(app.Db, new StubCurrentUserAccessor { UserId = userId }, clock);

    private static async Task<User> SeedUserAndVerseAsync(TestApp app, StubDateTimeProvider clock)
    {
        var user = NewUser();
        app.Db.Users.Add(user);
        app.Db.VersesOfDay.Add(Verse(LocalDay.Today(clock).DayOfYear));
        await app.Db.SaveChangesAsync();
        return user;
    }

    [Fact]
    public async Task Defaults_apply_when_no_schedule_exists_and_none_is_persisted()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider(); // Monday 08:00 Toronto
        var user = await SeedUserAndVerseAsync(app, clock);

        var dto = await Handler(app, user.Id, clock).Handle(new GetTodayQuery(), default);

        dto.Fasting.Current.Should().BeNull();
        dto.Fasting.TargetHours.Should().Be(16);
        dto.Fasting.TodayWindow.Start.Should().Be(new TimeOnly(12, 0));
        dto.Fasting.TodayWindow.End.Should().Be(new TimeOnly(20, 0));
        dto.Fasting.WindowOpen.Should().BeFalse("08:00 is before the window opens");

        // The dashboard is read-only: lazy creation belongs to GET /api/fasting/current.
        (await app.Db.FastingSchedules.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task After_8pm_local_utc_is_already_tomorrow_but_the_window_math_stays_on_todays_local_day()
    {
        await using var app = TestApp.Create();
        // 2026-05-19 00:30Z = Monday 2026-05-18 20:30 in Toronto (EDT).
        var clock = new StubDateTimeProvider { UtcNow = new DateTimeOffset(2026, 5, 19, 0, 30, 0, TimeSpan.Zero) };
        var user = await SeedUserAndVerseAsync(app, clock);

        var dto = await Handler(app, user.Id, clock).Handle(new GetTodayQuery(), default);

        dto.Date.Should().Be(new DateOnly(2026, 5, 18), "local Toronto day, not the UTC date");
        dto.Fasting.TodayWindow.End.Should().Be(new TimeOnly(20, 0));
        dto.Fasting.WindowOpen.Should().BeFalse("20:30 local is past the window close");
    }

    [Fact]
    public async Task Inside_the_eating_window_window_open_is_true()
    {
        await using var app = TestApp.Create();
        // 2026-05-18 17:00Z = Monday 13:00 in Toronto.
        var clock = new StubDateTimeProvider { UtcNow = new DateTimeOffset(2026, 5, 18, 17, 0, 0, TimeSpan.Zero) };
        var user = await SeedUserAndVerseAsync(app, clock);

        var dto = await Handler(app, user.Id, clock).Handle(new GetTodayQuery(), default);

        dto.Fasting.WindowOpen.Should().BeTrue();
    }

    [Fact]
    public async Task The_sunday_override_drives_the_window_on_sundays()
    {
        await using var app = TestApp.Create();
        // 2026-05-17 17:00Z = Sunday 13:00 Toronto — before the 13:30 override opens.
        var clock = new StubDateTimeProvider { UtcNow = new DateTimeOffset(2026, 5, 17, 17, 0, 0, TimeSpan.Zero) };
        var user = NewUser();
        app.Db.Users.Add(user);
        app.Db.VersesOfDay.Add(Verse(LocalDay.Today(clock).DayOfYear));
        app.Db.FastingSchedules.Add(Shalom.Application.Fasting.FastingDefaults.CreateDefault(user.Id));
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new GetTodayQuery(), default);

        dto.Fasting.TodayWindow.Start.Should().Be(new TimeOnly(13, 30));
        dto.Fasting.TodayWindow.End.Should().Be(new TimeOnly(20, 30));
        dto.Fasting.WindowOpen.Should().BeFalse("13:00 is before the Sunday window opens");
    }

    [Fact]
    public async Task Surfaces_the_open_fast_todays_workouts_and_the_last_meal()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = await SeedUserAndVerseAsync(app, clock);

        app.Db.FastingSessions.Add(new FastingSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            StartedAt = clock.UtcNow.AddHours(-11),
            TargetHours = 16,
        });
        // Today 07:00 local (11:00Z).
        app.Db.Workouts.Add(new Workout
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Equipment = EquipmentType.IndoorBike,
            StartedAt = new DateTimeOffset(2026, 5, 18, 11, 0, 0, TimeSpan.Zero),
            DurationMinutes = 24,
        });
        // Yesterday — must not appear under todaysWorkouts.
        app.Db.Workouts.Add(new Workout
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Equipment = EquipmentType.Treadmill,
            StartedAt = new DateTimeOffset(2026, 5, 17, 11, 0, 0, TimeSpan.Zero),
            DurationMinutes = 31,
        });
        app.Db.MealEntries.Add(new MealEntry
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Text = "salmon + greens",
            Tags = "home-cooked,fish",
            OccurredAt = clock.UtcNow.AddHours(-13),
            CreatedAt = clock.UtcNow.AddHours(-13),
        });
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new GetTodayQuery(), default);

        dto.Fasting.Current.Should().NotBeNull();
        dto.Fasting.Current!.ElapsedHours.Should().BeApproximately(11, 0.01);
        dto.Health.TodaysWorkouts.Should().ContainSingle()
            .Which.Equipment.Should().Be(EquipmentType.IndoorBike);
        dto.Health.LastMeal.Should().NotBeNull();
        dto.Health.LastMeal!.Text.Should().Be("salmon + greens");
        dto.Health.LastMeal.Tags.Should().Equal("home-cooked", "fish");
    }

    [Fact]
    public async Task Fasting_streak_counts_completed_fasts_on_the_local_day_they_ended()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider(); // today = Monday 2026-05-18
        var user = await SeedUserAndVerseAsync(app, clock);

        // Completed fast: started Sat 20:00 local (Sun 00:00Z), ended Sun
        // 12:30 local (16:30Z) — 16.5h. It ENDED Sunday, so Sunday earns it.
        app.Db.FastingSessions.Add(new FastingSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            StartedAt = new DateTimeOffset(2026, 5, 17, 0, 0, 0, TimeSpan.Zero),
            TargetHours = 16,
            EndedAt = new DateTimeOffset(2026, 5, 17, 16, 30, 0, TimeSpan.Zero),
        });
        // Ended-early fast on Saturday — derived outcome says it never counts.
        app.Db.FastingSessions.Add(new FastingSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            StartedAt = new DateTimeOffset(2026, 5, 16, 1, 0, 0, TimeSpan.Zero),
            TargetHours = 16,
            EndedAt = new DateTimeOffset(2026, 5, 16, 10, 0, 0, TimeSpan.Zero),
        });
        // Movement: workouts Sunday and Monday local.
        app.Db.Workouts.Add(new Workout
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Equipment = EquipmentType.Elliptical,
            StartedAt = new DateTimeOffset(2026, 5, 17, 12, 0, 0, TimeSpan.Zero),
            DurationMinutes = 20,
        });
        app.Db.Workouts.Add(new Workout
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Equipment = EquipmentType.IndoorBike,
            StartedAt = new DateTimeOffset(2026, 5, 18, 11, 0, 0, TimeSpan.Zero),
            DurationMinutes = 24,
        });
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new GetTodayQuery(), default);

        // Sunday completed + unlogged today (in progress) => current 1.
        dto.Streaks.FastingCurrent.Should().Be(1);
        dto.Streaks.FastingLongest.Should().Be(1);
        // Workouts Sunday + Monday => current 2.
        dto.Streaks.MovementCurrent.Should().Be(2);
        dto.Streaks.MovementLongest.Should().Be(2);
    }

    [Fact]
    public async Task A_fast_ending_after_8pm_local_lands_on_the_local_day_not_the_utc_day()
    {
        await using var app = TestApp.Create();
        // Now: Tue 2026-05-19 10:00Z (06:00 local).
        var clock = new StubDateTimeProvider { UtcNow = new DateTimeOffset(2026, 5, 19, 10, 0, 0, TimeSpan.Zero) };
        var user = await SeedUserAndVerseAsync(app, clock);

        // Completed fast ended Monday 21:00 local = Tue 01:00Z. The UTC date
        // says Tuesday; the streak must credit Monday.
        app.Db.FastingSessions.Add(new FastingSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            StartedAt = new DateTimeOffset(2026, 5, 18, 9, 0, 0, TimeSpan.Zero),
            TargetHours = 16,
            EndedAt = new DateTimeOffset(2026, 5, 19, 1, 0, 0, TimeSpan.Zero),
        });
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new GetTodayQuery(), default);

        // Monday credited; Tuesday unlogged-but-in-progress => current 1.
        dto.Streaks.FastingCurrent.Should().Be(1);
    }
}
