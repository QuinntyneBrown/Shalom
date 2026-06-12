using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.CheckIns;
using Shalom.Application.Common;
using Shalom.Application.Exceptions;
using Shalom.Application.Tests.Support;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.CheckIns;

public class UpsertTodayCheckInCommandHandlerTests
{
    private static User NewUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "quinn@example.com",
        NormalizedEmail = "quinn@example.com",
    };

    [Fact]
    public async Task First_upsert_creates_todays_check_in_with_server_derived_local_date()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var handler = new UpsertTodayCheckInCommandHandler(
            app.Db, new StubCurrentUserAccessor { UserId = user.Id }, clock);
        var dto = await handler.Handle(new UpsertTodayCheckInCommand(4, 3, "grateful"), default);

        dto.Date.Should().Be(LocalDay.Today(clock));
        dto.MoodRating.Should().Be(4);
        dto.SpiritualRating.Should().Be(3);
        dto.Note.Should().Be("grateful");

        var stored = await app.Db.DailyCheckIns.SingleAsync();
        stored.UserId.Should().Be(user.Id);
        stored.Date.Should().Be(LocalDay.Today(clock));
        stored.CreatedAt.Should().Be(clock.UtcNow);
        stored.UpdatedAt.Should().BeNull();
    }

    [Fact]
    public async Task Upsert_twice_on_the_same_day_updates_the_single_row()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var handler = new UpsertTodayCheckInCommandHandler(
            app.Db, new StubCurrentUserAccessor { UserId = user.Id }, clock);

        var first = await handler.Handle(new UpsertTodayCheckInCommand(2, 2, "rough start"), default);
        var second = await handler.Handle(new UpsertTodayCheckInCommand(5, 4, null), default);

        second.Id.Should().Be(first.Id);
        second.MoodRating.Should().Be(5);
        second.SpiritualRating.Should().Be(4);
        second.Note.Should().BeNull();

        var stored = await app.Db.DailyCheckIns.SingleAsync();
        stored.MoodRating.Should().Be(5);
        stored.SpiritualRating.Should().Be(4);
        stored.Note.Should().BeNull();
        stored.UpdatedAt.Should().Be(clock.UtcNow);
    }

    [Fact]
    public async Task Upsert_on_a_new_day_creates_a_second_row()
    {
        await using var app = TestApp.Create();
        var clock = new StubDateTimeProvider();
        var user = NewUser();
        app.Db.Users.Add(user);
        await app.Db.SaveChangesAsync();

        var handler = new UpsertTodayCheckInCommandHandler(
            app.Db, new StubCurrentUserAccessor { UserId = user.Id }, clock);

        await handler.Handle(new UpsertTodayCheckInCommand(3, 3, null), default);

        clock.UtcNow = clock.UtcNow.AddDays(1);
        await handler.Handle(new UpsertTodayCheckInCommand(4, 4, null), default);

        (await app.Db.DailyCheckIns.CountAsync()).Should().Be(2);
    }

    [Fact]
    public async Task Upsert_without_an_authenticated_user_throws_invalid_credentials()
    {
        await using var app = TestApp.Create();
        var handler = new UpsertTodayCheckInCommandHandler(
            app.Db, new StubCurrentUserAccessor(), new StubDateTimeProvider());

        var act = async () => await handler.Handle(new UpsertTodayCheckInCommand(3, 3, null), default);

        await act.Should().ThrowAsync<InvalidCredentialsException>();
    }
}
