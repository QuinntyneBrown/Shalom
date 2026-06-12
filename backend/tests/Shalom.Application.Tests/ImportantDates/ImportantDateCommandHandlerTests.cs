using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Exceptions;
using Shalom.Application.ImportantDates;
using Shalom.Application.Tests.Support;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.ImportantDates;

public class ImportantDateCommandHandlerTests
{
    private static User NewUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "quinn@example.com",
        NormalizedEmail = "quinn@example.com",
    };

    private static Person NewPerson(Guid userId) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Name = "Natalie",
    };

    [Fact]
    public async Task Add_stores_the_date_and_returns_the_derived_next_occurrence()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider(); // local today = 2026-05-18
        var user = NewUser();
        var person = NewPerson(user.Id);
        app.Db.Users.Add(user);
        app.Db.People.Add(person);
        await app.Db.SaveChangesAsync();

        var handler = new AddImportantDateCommandHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id }, clock);
        var dto = await handler.Handle(new AddImportantDateCommand(person.Id, "Anniversary", 5, 23), default);

        dto.Label.Should().Be("Anniversary");
        dto.LeadDays.Should().Be(7);
        dto.NextOccurrence.Should().Be(new DateOnly(2026, 5, 23));
        dto.DaysUntil.Should().Be(5);

        (await app.Db.ImportantDates.SingleAsync()).PersonId.Should().Be(person.Id);
    }

    [Fact]
    public async Task Add_to_a_missing_person_reads_as_not_found()
    {
        await using var app = TestApp.Create();
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var handler = new AddImportantDateCommandHandler(
            app.Db, new StubCurrentUserAccessor { UserId = user.Id }, new StubDateTimeProvider());
        var act = async () => await handler.Handle(
            new AddImportantDateCommand(Guid.NewGuid(), "Birthday", 2, 11), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Remove_deletes_the_row()
    {
        await using var app = TestApp.Create();
        var user = NewUser();
        var person = NewPerson(user.Id);
        var date = new ImportantDate
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            PersonId = person.Id,
            Label = "Birthday",
            Month = 2,
            Day = 11,
        };
        app.Db.Users.Add(user);
        app.Db.People.Add(person);
        app.Db.ImportantDates.Add(date);
        await app.Db.SaveChangesAsync();

        var handler = new RemoveImportantDateCommandHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id });
        await handler.Handle(new RemoveImportantDateCommand(date.Id), default);

        (await app.Db.ImportantDates.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Remove_someone_elses_date_reads_as_not_found()
    {
        await using var app = TestApp.Create();
        var user = NewUser();
        var date = new ImportantDate
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            PersonId = Guid.NewGuid(),
            Label = "Birthday",
            Month = 2,
            Day = 11,
        };
        app.Db.Users.Add(user);
        app.Db.ImportantDates.Add(date);
        await app.Db.SaveChangesAsync();

        var handler = new RemoveImportantDateCommandHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id });
        var act = async () => await handler.Handle(new RemoveImportantDateCommand(date.Id), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }
}
