using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Common;
using Shalom.Application.Exceptions;
using Shalom.Application.People;
using Shalom.Application.Tests.Support;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.People;

public class PeopleCommandHandlerTests
{
    private static User NewUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "quinn@example.com",
        NormalizedEmail = "quinn@example.com",
    };

    private static Person NewPerson(Guid userId, string name = "Natalie") => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Name = name,
        Relationship = "Wife",
        ContactCadenceDays = 2,
    };

    [Fact]
    public async Task Create_stores_the_person_and_returns_the_dto()
    {
        await using var app = TestApp.Create();
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var handler = new CreatePersonCommandHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id });
        var dto = await handler.Handle(
            new CreatePersonCommand("  Natalie ", "Wife", "+1 416 555 0100", 2, "loves peonies"), default);

        dto.Name.Should().Be("Natalie");
        dto.Relationship.Should().Be("Wife");
        dto.Phone.Should().Be("+1 416 555 0100");
        dto.ContactCadenceDays.Should().Be(2);
        dto.LastContactedOn.Should().BeNull();
        dto.SnoozedUntil.Should().BeNull();

        var stored = await app.Db.People.SingleAsync();
        stored.UserId.Should().Be(user.Id);
        stored.IsArchived.Should().BeFalse();
    }

    [Fact]
    public async Task Update_edits_identity_fields_but_not_contact_facts()
    {
        await using var app = TestApp.Create();
        var user = NewUser();
        var person = NewPerson(user.Id);
        person.LastContactedOn = new DateOnly(2026, 5, 1);
        app.Db.Users.Add(user);
        app.Db.People.Add(person);
        await app.Db.SaveChangesAsync();

        var handler = new UpdatePersonCommandHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id });
        var dto = await handler.Handle(
            new UpdatePersonCommand(person.Id, "Natalie B", "Wife", "+1 416 555 0199", 3, null), default);

        dto.Name.Should().Be("Natalie B");
        dto.Phone.Should().Be("+1 416 555 0199");
        dto.ContactCadenceDays.Should().Be(3);
        dto.LastContactedOn.Should().Be(new DateOnly(2026, 5, 1), "contact facts belong to their own commands");
    }

    [Fact]
    public async Task Update_someone_elses_person_reads_as_not_found()
    {
        await using var app = TestApp.Create();
        var user = NewUser();
        var person = NewPerson(Guid.NewGuid());
        app.Db.Users.Add(user);
        app.Db.People.Add(person);
        await app.Db.SaveChangesAsync();

        var handler = new UpdatePersonCommandHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id });
        var act = async () => await handler.Handle(
            new UpdatePersonCommand(person.Id, "Hijack"), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Archive_soft_deletes_and_keeps_the_row()
    {
        await using var app = TestApp.Create();
        var user = NewUser();
        var person = NewPerson(user.Id);
        app.Db.Users.Add(user);
        app.Db.People.Add(person);
        await app.Db.SaveChangesAsync();

        var handler = new ArchivePersonCommandHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id });
        await handler.Handle(new ArchivePersonCommand(person.Id), default);

        var stored = await app.Db.People.SingleAsync();
        stored.IsArchived.Should().BeTrue();
    }

    [Fact]
    public async Task Record_contact_stamps_the_server_local_today_and_clears_the_snooze()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        var person = NewPerson(user.Id);
        person.SnoozedUntil = LocalDay.Today(clock).AddDays(1);
        app.Db.Users.Add(user);
        app.Db.People.Add(person);
        await app.Db.SaveChangesAsync();

        var handler = new RecordContactCommandHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id }, clock);
        var dto = await handler.Handle(new RecordContactCommand(person.Id), default);

        dto.LastContactedOn.Should().Be(LocalDay.Today(clock));
        dto.SnoozedUntil.Should().BeNull();

        var stored = await app.Db.People.SingleAsync();
        stored.LastContactedOn.Should().Be(LocalDay.Today(clock));
        stored.SnoozedUntil.Should().BeNull();
    }

    [Fact]
    public async Task Snooze_sets_not_today_until_tomorrow()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        var person = NewPerson(user.Id);
        app.Db.Users.Add(user);
        app.Db.People.Add(person);
        await app.Db.SaveChangesAsync();

        var handler = new SnoozePersonCommandHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id }, clock);
        var dto = await handler.Handle(new SnoozePersonCommand(person.Id), default);

        dto.SnoozedUntil.Should().Be(LocalDay.Today(clock).AddDays(1));
    }

    [Fact]
    public async Task Record_contact_on_an_archived_person_reads_as_not_found()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        var person = NewPerson(user.Id);
        person.IsArchived = true;
        app.Db.Users.Add(user);
        app.Db.People.Add(person);
        await app.Db.SaveChangesAsync();

        var handler = new RecordContactCommandHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id }, clock);
        var act = async () => await handler.Handle(new RecordContactCommand(person.Id), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Without_an_authenticated_user_create_throws_invalid_credentials()
    {
        await using var app = TestApp.Create();
        var handler = new CreatePersonCommandHandler(app.Db, new StubCurrentUserAccessor());

        var act = async () => await handler.Handle(new CreatePersonCommand("Natalie"), default);

        await act.Should().ThrowAsync<InvalidCredentialsException>();
    }
}
