using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Common;
using Shalom.Application.Exceptions;
using Shalom.Application.Gratitude;
using Shalom.Application.Tests.Support;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.Gratitude;

public class GratitudeHandlerTests
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
    public async Task Add_stamps_the_server_local_today_and_links_the_person()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        var person = NewPerson(user.Id);
        app.Db.Users.Add(user);
        app.Db.People.Add(person);
        await app.Db.SaveChangesAsync();

        var handler = new AddGratitudeEntryCommandHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id }, clock);
        var dto = await handler.Handle(
            new AddGratitudeEntryCommand("  The way she prayed with the girls.  ", person.Id), default);

        dto.Text.Should().Be("The way she prayed with the girls.");
        dto.PersonId.Should().Be(person.Id);
        dto.OccurredOn.Should().Be(LocalDay.Today(clock));

        var stored = await app.Db.GratitudeEntries.SingleAsync();
        stored.CreatedAt.Should().Be(clock.UtcNow);
    }

    [Fact]
    public async Task Add_without_a_person_is_fine()
    {
        await using var app = TestApp.Create();
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var handler = new AddGratitudeEntryCommandHandler(
            app.Db, new StubCurrentUserAccessor { UserId = user.Id }, new StubDateTimeProvider());
        var dto = await handler.Handle(new AddGratitudeEntryCommand("Sunrise over the lake."), default);

        dto.PersonId.Should().BeNull();
    }

    [Fact]
    public async Task Add_with_a_missing_person_reads_as_not_found()
    {
        await using var app = TestApp.Create();
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var handler = new AddGratitudeEntryCommandHandler(
            app.Db, new StubCurrentUserAccessor { UserId = user.Id }, new StubDateTimeProvider());
        var act = async () => await handler.Handle(
            new AddGratitudeEntryCommand("note", Guid.NewGuid()), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task List_filters_by_person_newest_first_and_honours_take()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        var person = NewPerson(user.Id);
        app.Db.Users.Add(user);
        app.Db.People.Add(person);
        for (var i = 0; i < 3; i++)
        {
            app.Db.GratitudeEntries.Add(new GratitudeEntry
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                PersonId = person.Id,
                Text = $"note {i}",
                OccurredOn = LocalDay.Today(clock).AddDays(-i),
                CreatedAt = clock.UtcNow.AddDays(-i),
            });
        }
        app.Db.GratitudeEntries.Add(new GratitudeEntry
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            PersonId = null,
            Text = "unlinked",
            OccurredOn = LocalDay.Today(clock),
            CreatedAt = clock.UtcNow,
        });
        await app.Db.SaveChangesAsync();

        var handler = new ListGratitudeQueryHandler(app.Db, new StubCurrentUserAccessor { UserId = user.Id });

        var forPerson = await handler.Handle(new ListGratitudeQuery(person.Id, Take: 2), default);
        forPerson.Select(e => e.Text).Should().Equal("note 0", "note 1");

        var all = await handler.Handle(new ListGratitudeQuery(), default);
        all.Should().HaveCount(4);
        all[0].Text.Should().BeOneOf("note 0", "unlinked"); // same CreatedAt tick
    }

    [Fact]
    public void Validator_requires_text_and_caps_it_at_500()
    {
        var validator = new AddGratitudeEntryCommandValidator();
        validator.Validate(new AddGratitudeEntryCommand("")).IsValid.Should().BeFalse();
        validator.Validate(new AddGratitudeEntryCommand(new string('x', 501))).IsValid.Should().BeFalse();
        validator.Validate(new AddGratitudeEntryCommand(new string('x', 500))).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validator_caps_take_between_1_and_100()
    {
        var validator = new ListGratitudeQueryValidator();
        validator.Validate(new ListGratitudeQuery(Take: 0)).IsValid.Should().BeFalse();
        validator.Validate(new ListGratitudeQuery(Take: 101)).IsValid.Should().BeFalse();
        validator.Validate(new ListGratitudeQuery(Take: 20)).IsValid.Should().BeTrue();
    }
}
