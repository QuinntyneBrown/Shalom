using FluentAssertions;
using Shalom.Application.Common;
using Shalom.Application.Exceptions;
using Shalom.Application.Tests.Support;
using Shalom.Application.Today;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.Today;

public class GetTodayQueryHandlerTests
{
    private static User NewUser(string email = "quinn@example.com") => new()
    {
        Id = Guid.NewGuid(),
        Email = email,
        NormalizedEmail = email.ToLowerInvariant(),
    };

    private static VerseOfDay Verse(int dayOfYear, string reference = "John 3:16") => new()
    {
        Id = Guid.NewGuid(),
        DayOfYear = dayOfYear,
        Reference = reference,
        Text = $"Verse text for day {dayOfYear}.",
        YouVersionUrl = $"https://www.bible.com/bible/111/JHN.3.{dayOfYear}",
    };

    private static GetTodayQueryHandler Handler(TestApp app, Guid userId, StubDateTimeProvider clock) =>
        new(app.Db, new StubCurrentUserAccessor { UserId = userId }, clock);

    [Fact]
    public async Task Composes_the_full_dashboard_for_today()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var today = LocalDay.Today(clock);
        var user = NewUser();
        app.Db.Users.Add(user);
        app.Db.VersesOfDay.Add(Verse(today.DayOfYear));

        var plan = new ReadingPlan { Id = Guid.NewGuid(), Name = "John & His Letters", StartDate = today.AddDays(-2), IsActive = true };
        app.Db.ReadingPlans.Add(plan);
        app.Db.ReadingPlanDays.AddRange(
            new ReadingPlanDay { Id = Guid.NewGuid(), ReadingPlanId = plan.Id, DayNumber = 1, PassageReference = "John 1", YouVersionUrl = "https://www.bible.com/bible/111/JHN.1", CompletedOn = today.AddDays(-1) },
            new ReadingPlanDay { Id = Guid.NewGuid(), ReadingPlanId = plan.Id, DayNumber = 2, PassageReference = "John 2", YouVersionUrl = "https://www.bible.com/bible/111/JHN.2" },
            new ReadingPlanDay { Id = Guid.NewGuid(), ReadingPlanId = plan.Id, DayNumber = 3, PassageReference = "John 3", YouVersionUrl = "https://www.bible.com/bible/111/JHN.3" });

        app.Db.DailyCheckIns.AddRange(
            new DailyCheckIn { Id = Guid.NewGuid(), UserId = user.Id, Date = today, MoodRating = 4, SpiritualRating = 3, Note = "calm" },
            new DailyCheckIn { Id = Guid.NewGuid(), UserId = user.Id, Date = today.AddDays(-1), MoodRating = 3, SpiritualRating = 3 });
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new GetTodayQuery(), default);

        dto.Date.Should().Be(today);
        dto.GreetingName.Should().Be("quinn");

        dto.CheckIn.Should().NotBeNull();
        dto.CheckIn!.MoodRating.Should().Be(4);
        dto.CheckIn.Note.Should().Be("calm");

        dto.Verse.Reference.Should().Be("John 3:16");
        dto.Verse.Text.Should().Be($"Verse text for day {today.DayOfYear}.");

        dto.Reading.Should().NotBeNull();
        dto.Reading!.DayNumber.Should().Be(2);
        dto.Reading.PassageReference.Should().Be("John 2");
        dto.Reading.CompletedToday.Should().BeFalse();
        dto.Reading.PlanName.Should().Be("John & His Letters");
        dto.Reading.CompletedCount.Should().Be(1);
        dto.Reading.TotalDays.Should().Be(3);

        // Check-ins yesterday + today => current 2; reading completed yesterday only => current 1.
        dto.Streaks.CheckInCurrent.Should().Be(2);
        dto.Streaks.CheckInLongest.Should().Be(2);
        dto.Streaks.ReadingCurrent.Should().Be(1);
        dto.Streaks.ReadingLongest.Should().Be(1);
    }

    [Fact]
    public async Task A_day_completed_today_stays_the_current_day_with_completed_today_true()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var today = LocalDay.Today(clock);
        var user = NewUser();
        app.Db.Users.Add(user);
        app.Db.VersesOfDay.Add(Verse(today.DayOfYear));

        var plan = new ReadingPlan { Id = Guid.NewGuid(), Name = "Plan", StartDate = today, IsActive = true };
        app.Db.ReadingPlans.Add(plan);
        var done = new ReadingPlanDay { Id = Guid.NewGuid(), ReadingPlanId = plan.Id, DayNumber = 1, PassageReference = "John 1", YouVersionUrl = "https://www.bible.com/bible/111/JHN.1", CompletedOn = today };
        app.Db.ReadingPlanDays.AddRange(
            done,
            new ReadingPlanDay { Id = Guid.NewGuid(), ReadingPlanId = plan.Id, DayNumber = 2, PassageReference = "John 2", YouVersionUrl = "https://www.bible.com/bible/111/JHN.2" });
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new GetTodayQuery(), default);

        dto.Reading.Should().NotBeNull();
        dto.Reading!.DayId.Should().Be(done.Id);
        dto.Reading.CompletedToday.Should().BeTrue();
        dto.Reading.CompletedCount.Should().Be(1);
    }

    [Fact]
    public async Task Reading_is_null_when_the_active_plan_is_finished()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var today = LocalDay.Today(clock);
        var user = NewUser();
        app.Db.Users.Add(user);
        app.Db.VersesOfDay.Add(Verse(today.DayOfYear));

        var plan = new ReadingPlan { Id = Guid.NewGuid(), Name = "Plan", StartDate = today.AddDays(-5), IsActive = true };
        app.Db.ReadingPlans.Add(plan);
        app.Db.ReadingPlanDays.Add(new ReadingPlanDay
        {
            Id = Guid.NewGuid(),
            ReadingPlanId = plan.Id,
            DayNumber = 1,
            PassageReference = "John 1",
            YouVersionUrl = "https://www.bible.com/bible/111/JHN.1",
            CompletedOn = today.AddDays(-1),
        });
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new GetTodayQuery(), default);

        dto.Reading.Should().BeNull();
    }

    [Fact]
    public async Task Reading_is_null_when_no_plan_is_active()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        app.Db.VersesOfDay.Add(Verse(LocalDay.Today(clock).DayOfYear));
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new GetTodayQuery(), default);

        dto.Reading.Should().BeNull();
    }

    [Fact]
    public async Task Leap_year_day_366_falls_back_to_the_day_365_verse_when_no_366_row_exists()
    {
        await using var app = TestApp.Create();
        // 2028-12-31 is day 366 in Toronto (EST, UTC-5): 18:00Z is 13:00 local.
        var clock = new StubDateTimeProvider { UtcNow = new DateTimeOffset(2028, 12, 31, 18, 0, 0, TimeSpan.Zero) };
        LocalDay.Today(clock).DayOfYear.Should().Be(366);

        var user = NewUser();
        app.Db.Users.Add(user);
        app.Db.VersesOfDay.Add(Verse(365, reference: "Revelation 22:21"));
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new GetTodayQuery(), default);

        dto.Verse.Reference.Should().Be("Revelation 22:21");
    }

    [Fact]
    public async Task Check_in_is_null_when_today_has_no_check_in()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var today = LocalDay.Today(clock);
        var user = NewUser();
        app.Db.Users.Add(user);
        app.Db.VersesOfDay.Add(Verse(today.DayOfYear));
        app.Db.DailyCheckIns.Add(new DailyCheckIn
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Date = today.AddDays(-1),
            MoodRating = 3,
            SpiritualRating = 3,
        });
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new GetTodayQuery(), default);

        dto.CheckIn.Should().BeNull();
        dto.Streaks.CheckInCurrent.Should().Be(1, "an unlogged today never breaks the streak");
    }

    [Fact]
    public async Task Without_an_authenticated_user_throws_invalid_credentials()
    {
        await using var app = TestApp.Create();
        var handler = new GetTodayQueryHandler(app.Db, new StubCurrentUserAccessor(), new StubDateTimeProvider());

        var act = async () => await handler.Handle(new GetTodayQuery(), default);

        await act.Should().ThrowAsync<InvalidCredentialsException>();
    }
}
