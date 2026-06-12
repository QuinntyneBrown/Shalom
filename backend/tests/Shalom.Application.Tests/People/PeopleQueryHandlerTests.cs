using FluentAssertions;
using Shalom.Application.Exceptions;
using Shalom.Application.People;
using Shalom.Application.Tests.Support;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.People;

public class PeopleQueryHandlerTests
{
    private static User NewUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "quinn@example.com",
        NormalizedEmail = "quinn@example.com",
    };

    private static Person NewPerson(Guid userId, string name, int? cadence = null) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Name = name,
        ContactCadenceDays = cadence,
    };

    [Fact]
    public async Task List_returns_active_people_only_ordered_by_name()
    {
        await using var app = TestApp.Create();
        var user = NewUser();
        var archived = NewPerson(user.Id, "Aaron");
        archived.IsArchived = true;
        app.Db.Users.Add(user);
        app.Db.People.AddRange(
            NewPerson(user.Id, "Zoe"),
            NewPerson(user.Id, "Maya"),
            archived,
            NewPerson(Guid.NewGuid(), "NotMine"));
        await app.Db.SaveChangesAsync();

        var handler = new ListPeopleQueryHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id });
        var list = await handler.Handle(new ListPeopleQuery(), default);

        list.Select(p => p.Name).Should().Equal("Maya", "Zoe");
    }

    [Fact]
    public async Task Get_returns_the_person_with_dates_and_days_until()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider(); // local today = 2026-05-18
        var user = NewUser();
        var person = NewPerson(user.Id, "Natalie", cadence: 2);
        app.Db.Users.Add(user);
        app.Db.People.Add(person);
        app.Db.ImportantDates.AddRange(
            new ImportantDate { Id = Guid.NewGuid(), UserId = user.Id, PersonId = person.Id, Label = "Anniversary", Month = 5, Day = 23, LeadDays = 7 },
            new ImportantDate { Id = Guid.NewGuid(), UserId = user.Id, PersonId = person.Id, Label = "Birthday", Month = 2, Day = 11, LeadDays = 7 });
        await app.Db.SaveChangesAsync();

        var handler = new GetPersonQueryHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id }, clock);
        var dto = await handler.Handle(new GetPersonQuery(person.Id), default);

        dto.Name.Should().Be("Natalie");
        dto.Dates.Should().HaveCount(2);
        // Soonest first: May 23 is 5 days out; Feb 11 wrapped to next year.
        dto.Dates[0].Label.Should().Be("Anniversary");
        dto.Dates[0].DaysUntil.Should().Be(5);
        dto.Dates[0].NextOccurrence.Should().Be(new DateOnly(2026, 5, 23));
        dto.Dates[1].Label.Should().Be("Birthday");
        dto.Dates[1].NextOccurrence.Should().Be(new DateOnly(2027, 2, 11));
    }

    [Fact]
    public async Task Get_an_archived_person_reads_as_not_found()
    {
        await using var app = TestApp.Create();
        var user = NewUser();
        var person = NewPerson(user.Id, "Old Friend");
        person.IsArchived = true;
        app.Db.Users.Add(user);
        app.Db.People.Add(person);
        await app.Db.SaveChangesAsync();

        var handler = new GetPersonQueryHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id }, new StubDateTimeProvider());
        var act = async () => await handler.Handle(new GetPersonQuery(person.Id), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }
}
