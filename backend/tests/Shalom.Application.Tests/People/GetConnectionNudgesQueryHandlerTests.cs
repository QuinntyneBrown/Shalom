using FluentAssertions;
using Shalom.Application.Common;
using Shalom.Application.People;
using Shalom.Application.Tests.Support;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.People;

public class GetConnectionNudgesQueryHandlerTests
{
    private static User NewUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "quinn@example.com",
        NormalizedEmail = "quinn@example.com",
    };

    private static Person Person(
        Guid userId, string name, int? cadence,
        DateOnly? lastContactedOn = null, DateOnly? snoozedUntil = null, bool archived = false) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Name = name,
        ContactCadenceDays = cadence,
        LastContactedOn = lastContactedOn,
        SnoozedUntil = snoozedUntil,
        IsArchived = archived,
    };

    [Fact]
    public async Task Returns_all_due_people_most_overdue_first_with_rendered_prompts()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var today = LocalDay.Today(clock);
        var user = NewUser();
        app.Db.Users.Add(user);
        app.Db.People.AddRange(
            Person(user.Id, "Marcus", cadence: 7, lastContactedOn: today.AddDays(-10)),  // 3 days past due
            Person(user.Id, "Never", cadence: 14),                                        // never contacted — most overdue
            Person(user.Id, "Recent", cadence: 7, lastContactedOn: today.AddDays(-2)),    // not due
            Person(user.Id, "NoCadence", cadence: null),                                  // never auto-due
            Person(user.Id, "Snoozed", cadence: 7, lastContactedOn: today.AddDays(-30), snoozedUntil: today.AddDays(1)),
            Person(user.Id, "Archived", cadence: 7, archived: true));
        await app.Db.SaveChangesAsync();

        var handler = new GetConnectionNudgesQueryHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id }, clock);
        var nudges = await handler.Handle(new GetConnectionNudgesQuery(), default);

        nudges.Select(n => n.Name).Should().Equal("Never", "Marcus");
        nudges.Should().AllSatisfy(n => n.Prompt.Should().NotBeNullOrWhiteSpace());
    }

    [Fact]
    public async Task An_expired_snooze_no_longer_hides_the_person()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var today = LocalDay.Today(clock);
        var user = NewUser();
        app.Db.Users.Add(user);
        app.Db.People.Add(Person(user.Id, "Marcus", cadence: 7, lastContactedOn: today.AddDays(-30), snoozedUntil: today));
        await app.Db.SaveChangesAsync();

        var handler = new GetConnectionNudgesQueryHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id }, clock);
        var nudges = await handler.Handle(new GetConnectionNudgesQuery(), default);

        nudges.Should().ContainSingle().Which.Name.Should().Be("Marcus");
    }
}
