using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Shalom.Domain.Entities;
using Shalom.Domain.Enums;
using Shalom.Infrastructure.Tests.Support;
using Xunit;

namespace Shalom.Infrastructure.Tests.Persistence;

public class ShalomDomainRoundTripTests : IAsyncLifetime
{
    private TestDatabase _db = null!;

    public async Task InitializeAsync() => _db = await TestDatabase.CreateAsync();
    public async Task DisposeAsync() => await _db.DisposeAsync();

    [Fact]
    public async Task DailyCheckIn_round_trips()
    {
        var userId = await SeedUser();
        var checkIn = new DailyCheckIn
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Date = new DateOnly(2026, 6, 12),
            MoodRating = 4,
            SpiritualRating = 4,
            Note = "Morning reading before sunrise.",
            CreatedAt = new DateTimeOffset(2026, 6, 12, 10, 30, 0, TimeSpan.Zero),
            UpdatedAt = null,
        };

        await using (var ctx = _db.CreateContext())
        {
            ctx.DailyCheckIns.Add(checkIn);
            await ctx.SaveChangesAsync();
        }

        await using var read = _db.CreateContext();
        var loaded = await read.DailyCheckIns.SingleAsync(c => c.Id == checkIn.Id);
        loaded.Date.Should().Be(new DateOnly(2026, 6, 12));
        loaded.MoodRating.Should().Be(4);
        loaded.SpiritualRating.Should().Be(4);
        loaded.Note.Should().Be("Morning reading before sunrise.");
        loaded.CreatedAt.Should().Be(new DateTimeOffset(2026, 6, 12, 10, 30, 0, TimeSpan.Zero));
        loaded.UpdatedAt.Should().BeNull();
    }

    [Fact]
    public async Task DailyCheckIn_unique_per_user_and_date_enforced()
    {
        var userId = await SeedUser();
        var date = new DateOnly(2026, 6, 12);

        await using (var ctx = _db.CreateContext())
        {
            ctx.DailyCheckIns.Add(NewCheckIn(userId, date));
            await ctx.SaveChangesAsync();
        }

        await using (var ctx = _db.CreateContext())
        {
            ctx.DailyCheckIns.Add(NewCheckIn(userId, date));
            var act = async () => await ctx.SaveChangesAsync();
            await act.Should().ThrowAsync<DbUpdateException>();
        }

        // Same date for a different user is fine.
        var otherUser = await SeedUser();
        await using (var ctx = _db.CreateContext())
        {
            ctx.DailyCheckIns.Add(NewCheckIn(otherUser, date));
            await ctx.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task Workout_round_trips_enum_decimal_and_nullables()
    {
        var userId = await SeedUser();
        var workout = new Workout
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Equipment = EquipmentType.Elliptical,
            StartedAt = new DateTimeOffset(2026, 6, 12, 11, 0, 0, TimeSpan.Zero),
            DurationMinutes = 32,
            DistanceKm = 5.25m,
            AvgHeartRateBpm = 132,
            ActiveCalories = 310,
            Notes = "Felt strong.",
            CreatedAt = new DateTimeOffset(2026, 6, 12, 11, 35, 0, TimeSpan.Zero),
        };

        await using (var ctx = _db.CreateContext())
        {
            ctx.Workouts.Add(workout);
            await ctx.SaveChangesAsync();
        }

        await using var read = _db.CreateContext();
        var loaded = await read.Workouts.SingleAsync(w => w.Id == workout.Id);
        loaded.Equipment.Should().Be(EquipmentType.Elliptical);
        loaded.StartedAt.Should().Be(new DateTimeOffset(2026, 6, 12, 11, 0, 0, TimeSpan.Zero));
        loaded.DurationMinutes.Should().Be(32);
        loaded.DistanceKm.Should().Be(5.25m);
        loaded.AvgHeartRateBpm.Should().Be(132);
        loaded.ActiveCalories.Should().Be(310);
    }

    [Fact]
    public async Task FastingSession_round_trips_with_open_session()
    {
        var userId = await SeedUser();
        var session = new FastingSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            StartedAt = new DateTimeOffset(2026, 6, 11, 23, 0, 0, TimeSpan.Zero),
            TargetHours = 16,
            EndedAt = null,
        };

        await using (var ctx = _db.CreateContext())
        {
            ctx.FastingSessions.Add(session);
            await ctx.SaveChangesAsync();
        }

        await using var read = _db.CreateContext();
        var loaded = await read.FastingSessions.SingleAsync(s => s.Id == session.Id);
        loaded.StartedAt.Should().Be(new DateTimeOffset(2026, 6, 11, 23, 0, 0, TimeSpan.Zero));
        loaded.TargetHours.Should().Be(16);
        loaded.EndedAt.Should().BeNull();
    }

    [Fact]
    public async Task FastingSchedule_round_trips_time_only_and_overrides()
    {
        var userId = await SeedUser();
        var schedule = new FastingSchedule
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            EatingWindowStart = new TimeOnly(11, 0),
            EatingWindowEnd = new TimeOnly(19, 0),
            TargetFastHours = 16,
            TimeZoneId = "America/Toronto",
            Overrides =
            {
                new FastingScheduleOverride
                {
                    DayOfWeek = DayOfWeek.Sunday,
                    EatingWindowStart = new TimeOnly(12, 30),
                    EatingWindowEnd = new TimeOnly(20, 0),
                },
            },
        };

        await using (var ctx = _db.CreateContext())
        {
            ctx.FastingSchedules.Add(schedule);
            await ctx.SaveChangesAsync();
        }

        await using var read = _db.CreateContext();
        var loaded = await read.FastingSchedules.SingleAsync(s => s.Id == schedule.Id);
        loaded.EatingWindowStart.Should().Be(new TimeOnly(11, 0));
        loaded.EatingWindowEnd.Should().Be(new TimeOnly(19, 0));
        loaded.TimeZoneId.Should().Be("America/Toronto");
        loaded.Overrides.Should().HaveCount(1);
        loaded.Overrides[0].DayOfWeek.Should().Be(DayOfWeek.Sunday);
        loaded.Overrides[0].EatingWindowStart.Should().Be(new TimeOnly(12, 30));
        loaded.Overrides[0].EatingWindowEnd.Should().Be(new TimeOnly(20, 0));
    }

    [Fact]
    public async Task ReadingPlan_and_days_round_trip_with_unique_day_number()
    {
        var plan = new ReadingPlan
        {
            Id = Guid.NewGuid(),
            Name = $"Plan {Guid.NewGuid():N}",
            StartDate = new DateOnly(2026, 6, 15),
            IsActive = true,
        };

        await using (var ctx = _db.CreateContext())
        {
            ctx.ReadingPlans.Add(plan);
            ctx.ReadingPlanDays.Add(new ReadingPlanDay
            {
                Id = Guid.NewGuid(),
                ReadingPlanId = plan.Id,
                DayNumber = 1,
                PassageReference = "John 1",
                YouVersionUrl = "https://www.bible.com/bible/111/JHN.1",
                CompletedOn = new DateOnly(2026, 6, 15),
            });
            await ctx.SaveChangesAsync();
        }

        await using (var read = _db.CreateContext())
        {
            var loadedPlan = await read.ReadingPlans.SingleAsync(p => p.Id == plan.Id);
            loadedPlan.StartDate.Should().Be(new DateOnly(2026, 6, 15));
            loadedPlan.IsActive.Should().BeTrue();

            var day = await read.ReadingPlanDays.SingleAsync(d => d.ReadingPlanId == plan.Id);
            day.PassageReference.Should().Be("John 1");
            day.CompletedOn.Should().Be(new DateOnly(2026, 6, 15));
        }

        await using (var ctx = _db.CreateContext())
        {
            ctx.ReadingPlanDays.Add(new ReadingPlanDay
            {
                Id = Guid.NewGuid(),
                ReadingPlanId = plan.Id,
                DayNumber = 1,
                PassageReference = "John 1 again",
                YouVersionUrl = "https://www.bible.com/bible/111/JHN.1",
            });
            var act = async () => await ctx.SaveChangesAsync();
            await act.Should().ThrowAsync<DbUpdateException>();
        }
    }

    [Fact]
    public async Task VerseOfDay_round_trips_and_day_of_year_unique()
    {
        var verse = new VerseOfDay
        {
            Id = Guid.NewGuid(),
            DayOfYear = 164,
            Reference = "John 3:16",
            Text = "For God so loved the world, that he gave his one and only Son, " +
                   "that whoever believes in him should not perish, but have eternal life.",
            YouVersionUrl = "https://www.bible.com/bible/111/JHN.3.16",
        };

        await using (var ctx = _db.CreateContext())
        {
            ctx.VersesOfDay.Add(verse);
            await ctx.SaveChangesAsync();
        }

        await using (var read = _db.CreateContext())
        {
            var loaded = await read.VersesOfDay.SingleAsync(v => v.DayOfYear == 164);
            loaded.Reference.Should().Be("John 3:16");
            loaded.Text.Should().Contain("For God so loved the world");
        }

        await using (var ctx = _db.CreateContext())
        {
            ctx.VersesOfDay.Add(new VerseOfDay
            {
                Id = Guid.NewGuid(),
                DayOfYear = 164,
                Reference = "Other",
                Text = "Other",
                YouVersionUrl = "https://example.org",
            });
            var act = async () => await ctx.SaveChangesAsync();
            await act.Should().ThrowAsync<DbUpdateException>();
        }
    }

    [Fact]
    public async Task Person_round_trips_date_only_fields()
    {
        var userId = await SeedUser();
        var person = new Person
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = "Mom",
            Relationship = "Mother",
            ContactCadenceDays = 7,
            LastContactedOn = new DateOnly(2026, 6, 7),
            Notes = "Loves Sunday calls.",
            IsArchived = false,
        };

        await using (var ctx = _db.CreateContext())
        {
            ctx.People.Add(person);
            await ctx.SaveChangesAsync();
        }

        await using var read = _db.CreateContext();
        var loaded = await read.People.SingleAsync(p => p.Id == person.Id);
        loaded.Name.Should().Be("Mom");
        loaded.ContactCadenceDays.Should().Be(7);
        loaded.LastContactedOn.Should().Be(new DateOnly(2026, 6, 7));
        loaded.IsArchived.Should().BeFalse();
    }

    [Fact]
    public async Task Deleting_person_nulls_gratitude_link_and_cascades_important_dates()
    {
        var userId = await SeedUser();
        var personId = Guid.NewGuid();
        var gratitudeId = Guid.NewGuid();

        await using (var ctx = _db.CreateContext())
        {
            ctx.People.Add(new Person { Id = personId, UserId = userId, Name = "Sam" });
            ctx.GratitudeEntries.Add(new GratitudeEntry
            {
                Id = gratitudeId,
                UserId = userId,
                PersonId = personId,
                Text = "Grateful for Sam's encouragement.",
                OccurredOn = new DateOnly(2026, 6, 10),
                CreatedAt = DateTimeOffset.UtcNow,
            });
            ctx.ImportantDates.Add(new ImportantDate
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                PersonId = personId,
                Label = "Birthday",
                Month = 9,
                Day = 21,
                Year = 1980,
                LeadDays = 7,
            });
            await ctx.SaveChangesAsync();
        }

        await using (var ctx = _db.CreateContext())
        {
            var person = await ctx.People.SingleAsync(p => p.Id == personId);
            ctx.People.Remove(person);
            await ctx.SaveChangesAsync();
        }

        await using (var read = _db.CreateContext())
        {
            var gratitude = await read.GratitudeEntries.SingleAsync(g => g.Id == gratitudeId);
            gratitude.PersonId.Should().BeNull("deleting a person keeps the gratitude, just unlinks it");
            gratitude.OccurredOn.Should().Be(new DateOnly(2026, 6, 10));

            (await read.ImportantDates.AnyAsync(d => d.PersonId == personId))
                .Should().BeFalse("important dates die with their person");
        }
    }

    private static DailyCheckIn NewCheckIn(Guid userId, DateOnly date) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Date = date,
        MoodRating = 3,
        SpiritualRating = 3,
        CreatedAt = DateTimeOffset.UtcNow,
    };

    private async Task<Guid> SeedUser()
    {
        var id = Guid.NewGuid();
        await using var ctx = _db.CreateContext();
        ctx.Users.Add(new User
        {
            Id = id,
            Email = $"u_{id:N}@example.com",
            NormalizedEmail = $"u_{id:N}@example.com",
            PasswordHash = "h",
        });
        await ctx.SaveChangesAsync();
        return id;
    }
}
