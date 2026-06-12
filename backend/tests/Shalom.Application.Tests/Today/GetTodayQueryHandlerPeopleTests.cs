using FluentAssertions;
using Shalom.Application.Common;
using Shalom.Application.People;
using Shalom.Application.Tests.Support;
using Shalom.Application.Today;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.Today;

/// <summary>
/// The connection slice of the Today aggregate: one nudge per day max,
/// suppressed entirely once anyone was contacted today, most-overdue
/// selection, day-of date replacement, and the lead-window upcoming list.
/// </summary>
public class GetTodayQueryHandlerPeopleTests
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
        Text = "Verse text.",
        YouVersionUrl = "https://www.bible.com/bible/111/JHN.3.16",
    };

    private static Person Person(
        Guid userId, string name, int? cadence = null, string? relationship = null,
        DateOnly? lastContactedOn = null, DateOnly? snoozedUntil = null, string? phone = null) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Name = name,
        Relationship = relationship,
        Phone = phone,
        ContactCadenceDays = cadence,
        LastContactedOn = lastContactedOn,
        SnoozedUntil = snoozedUntil,
    };

    private static async Task<(TestApp App, StubDateTimeProvider Clock, User User, DateOnly Today)> Arrange()
    {
        var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var today = LocalDay.Today(clock);
        var user = NewUser();
        app.Db.Users.Add(user);
        app.Db.VersesOfDay.Add(Verse(today.DayOfYear));
        await app.Db.SaveChangesAsync();
        return (app, clock, user, today);
    }

    private static GetTodayQueryHandler Handler(TestApp app, Guid userId, StubDateTimeProvider clock) =>
        new(app.Db, new StubCurrentUserAccessor { UserId = userId }, clock);

    [Fact]
    public async Task No_people_means_no_nudge_and_no_upcoming_dates()
    {
        var (app, clock, user, _) = await Arrange();
        await using var _app = app;

        var dto = await Handler(app, user.Id, clock).Handle(new GetTodayQuery(), default);

        dto.People.Nudge.Should().BeNull();
        dto.People.UpcomingDates.Should().BeEmpty();
    }

    [Fact]
    public async Task Any_contact_recorded_today_suppresses_the_nudge_entirely()
    {
        var (app, clock, user, today) = await Arrange();
        await using var _app = app;
        app.Db.People.AddRange(
            Person(user.Id, "Natalie", cadence: 2, lastContactedOn: today),
            Person(user.Id, "Marcus", cadence: 7, lastContactedOn: today.AddDays(-30)));
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new GetTodayQuery(), default);

        dto.People.Nudge.Should().BeNull("he already connected with someone today — the day is complete");
    }

    [Fact]
    public async Task The_most_overdue_due_person_is_picked_with_never_contacted_first()
    {
        var (app, clock, user, today) = await Arrange();
        await using var _app = app;
        app.Db.People.AddRange(
            Person(user.Id, "Marcus", cadence: 7, lastContactedOn: today.AddDays(-10)),
            Person(user.Id, "Never Contacted", cadence: 14),
            Person(user.Id, "No Cadence"));
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new GetTodayQuery(), default);

        dto.People.Nudge.Should().NotBeNull();
        dto.People.Nudge!.Name.Should().Be("Never Contacted");
    }

    [Fact]
    public async Task Equal_overdue_ties_break_by_name()
    {
        var (app, clock, user, _) = await Arrange();
        await using var _app = app;
        app.Db.People.AddRange(
            Person(user.Id, "Zoe", cadence: 7),
            Person(user.Id, "Maya", cadence: 7));
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new GetTodayQuery(), default);

        dto.People.Nudge!.Name.Should().Be("Maya");
    }

    [Fact]
    public async Task A_snoozed_person_is_skipped_for_the_next_due_person()
    {
        var (app, clock, user, today) = await Arrange();
        await using var _app = app;
        app.Db.People.AddRange(
            Person(user.Id, "Never Contacted", cadence: 14, snoozedUntil: today.AddDays(1)),
            Person(user.Id, "Marcus", cadence: 7, lastContactedOn: today.AddDays(-10)));
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new GetTodayQuery(), default);

        dto.People.Nudge!.Name.Should().Be("Marcus");
    }

    [Fact]
    public async Task The_nudge_prompt_is_deterministic_for_the_day_and_carries_the_phone()
    {
        var (app, clock, user, today) = await Arrange();
        await using var _app = app;
        app.Db.People.Add(Person(
            user.Id, "Natalie", cadence: 2, relationship: "Wife",
            lastContactedOn: today.AddDays(-5), phone: "+1 416 555 0100"));
        await app.Db.SaveChangesAsync();

        var handler = Handler(app, user.Id, clock);
        var first = await handler.Handle(new GetTodayQuery(), default);
        var second = await handler.Handle(new GetTodayQuery(), default);

        first.People.Nudge!.Prompt.Should().Be(NudgePrompts.For("Natalie", "Wife", today));
        second.People.Nudge!.Prompt.Should().Be(first.People.Nudge.Prompt);
        first.People.Nudge.Phone.Should().Be("+1 416 555 0100");
        first.People.Nudge.Relationship.Should().Be("Wife");
    }

    [Fact]
    public async Task A_day_of_important_date_replaces_the_rotation_prompt()
    {
        var (app, clock, user, today) = await Arrange();
        await using var _app = app;
        var natalie = Person(user.Id, "Natalie", cadence: 2, relationship: "Wife", lastContactedOn: today.AddDays(-5));
        var marcus = Person(user.Id, "Marcus", cadence: 7); // never contacted — would otherwise win
        app.Db.People.AddRange(natalie, marcus);
        app.Db.ImportantDates.Add(new ImportantDate
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            PersonId = natalie.Id,
            Label = "your anniversary",
            Month = today.Month,
            Day = today.Day,
            LeadDays = 7,
        });
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new GetTodayQuery(), default);

        dto.People.Nudge!.PersonId.Should().Be(natalie.Id);
        dto.People.Nudge.Prompt.Should().Be("It's your anniversary — make it count.");
    }

    [Fact]
    public async Task Upcoming_dates_respect_each_dates_lead_window_and_sort_soonest_first()
    {
        var (app, clock, user, today) = await Arrange();
        await using var _app = app;
        var natalie = Person(user.Id, "Natalie");
        var maya = Person(user.Id, "Maya");
        app.Db.People.AddRange(natalie, maya);

        ImportantDate DateIn(int days, Guid personId, string label, int leadDays = 7)
        {
            var date = today.AddDays(days);
            return new ImportantDate
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                PersonId = personId,
                Label = label,
                Month = date.Month,
                Day = date.Day,
                LeadDays = leadDays,
            };
        }

        app.Db.ImportantDates.AddRange(
            DateIn(5, natalie.Id, "Anniversary"),
            DateIn(2, maya.Id, "Birthday"),
            DateIn(20, maya.Id, "Recital"),                       // outside its 7-day window
            DateIn(20, natalie.Id, "Long lead", leadDays: 30));   // inside its 30-day window
        await app.Db.SaveChangesAsync();

        var dto = await Handler(app, user.Id, clock).Handle(new GetTodayQuery(), default);

        dto.People.UpcomingDates.Select(d => d.Label).Should().Equal("Birthday", "Anniversary", "Long lead");
        dto.People.UpcomingDates[0].PersonName.Should().Be("Maya");
        dto.People.UpcomingDates[0].DaysUntil.Should().Be(2);
        dto.People.UpcomingDates[0].Date.Should().Be(today.AddDays(2));
    }
}
