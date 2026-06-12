using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Shalom.Api.Tests.Support;
using Shalom.Application.Common;
using Xunit;

namespace Shalom.Api.Tests.People;

public class PeopleControllerTests : IClassFixture<ShalomApiFactory>
{
    private readonly ShalomApiFactory _factory;
    public PeopleControllerTests(ShalomApiFactory factory) { _factory = factory; }

    private record PersonDto(
        Guid Id, string Name, string? Relationship, string? Phone,
        int? ContactCadenceDays, string? Notes, string? LastContactedOn, string? SnoozedUntil);
    private record DateDto(
        Guid Id, Guid PersonId, string Label, int Month, int Day, int? Year,
        int LeadDays, string NextOccurrence, int DaysUntil);
    private record PersonDetailDto(
        Guid Id, string Name, string? Relationship, string? Phone,
        int? ContactCadenceDays, string? Notes, string? LastContactedOn, string? SnoozedUntil,
        List<DateDto> Dates);
    private record NudgeDto(Guid PersonId, string Name, string? Relationship, string Prompt, string? Phone);

    private DateOnly Today => LocalDay.Today(_factory.Clock);

    [Fact]
    public async Task People_endpoints_without_bearer_return_401()
    {
        var client = _factory.CreateClient();

        (await client.GetAsync("/api/people")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await client.PostAsJsonAsync("/api/people", new { name = "X" })).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await client.GetAsync("/api/people/nudges")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await client.DeleteAsync($"/api/important-dates/{Guid.NewGuid()}")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Create_get_update_contact_snooze_and_archive_round_trip()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();

        // Create.
        var created = await (await client.PostAsJsonAsync("/api/people", new
        {
            name = "Natalie",
            relationship = "Wife",
            phone = "+1 416 555 0100",
            contactCadenceDays = 2,
        })).Content.ReadFromJsonAsync<PersonDto>();
        created!.Name.Should().Be("Natalie");
        created.LastContactedOn.Should().BeNull();

        // List contains her, ordered by name.
        var list = await client.GetFromJsonAsync<List<PersonDto>>("/api/people");
        list.Should().ContainSingle(p => p.Id == created.Id);

        // Update.
        var updated = await (await client.PutAsJsonAsync($"/api/people/{created.Id}", new
        {
            name = "Natalie",
            relationship = "Wife",
            phone = "+1 416 555 0199",
            contactCadenceDays = 3,
        })).Content.ReadFromJsonAsync<PersonDto>();
        updated!.Phone.Should().Be("+1 416 555 0199");
        updated.ContactCadenceDays.Should().Be(3);

        // Snooze, then contact clears the snooze and stamps today.
        var snoozed = await (await client.PostAsync($"/api/people/{created.Id}/snooze", null))
            .Content.ReadFromJsonAsync<PersonDto>();
        snoozed!.SnoozedUntil.Should().Be(Today.AddDays(1).ToString("yyyy-MM-dd"));

        var contacted = await (await client.PostAsync($"/api/people/{created.Id}/contact", null))
            .Content.ReadFromJsonAsync<PersonDto>();
        contacted!.LastContactedOn.Should().Be(Today.ToString("yyyy-MM-dd"));
        contacted.SnoozedUntil.Should().BeNull();

        // Archive = DELETE, 204, gone from the list, detail 404.
        (await client.DeleteAsync($"/api/people/{created.Id}")).StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await client.GetFromJsonAsync<List<PersonDto>>("/api/people"))!
            .Should().NotContain(p => p.Id == created.Id);
        (await client.GetAsync($"/api/people/{created.Id}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Important_dates_round_trip_through_person_detail()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var person = await (await client.PostAsJsonAsync("/api/people", new { name = "Maya", relationship = "Daughter" }))
            .Content.ReadFromJsonAsync<PersonDto>();

        var inFive = Today.AddDays(5);
        var added = await (await client.PostAsJsonAsync($"/api/people/{person!.Id}/dates", new
        {
            label = "Birthday",
            month = inFive.Month,
            day = inFive.Day,
        })).Content.ReadFromJsonAsync<DateDto>();
        added!.LeadDays.Should().Be(7);
        added.DaysUntil.Should().Be(5);

        var detail = await client.GetFromJsonAsync<PersonDetailDto>($"/api/people/{person.Id}");
        detail!.Dates.Should().ContainSingle(d => d.Id == added.Id && d.DaysUntil == 5);

        (await client.DeleteAsync($"/api/important-dates/{added.Id}")).StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await client.GetFromJsonAsync<PersonDetailDto>($"/api/people/{person.Id}"))!
            .Dates.Should().BeEmpty();
    }

    [Fact]
    public async Task Nudges_lists_due_people_and_contact_today_clears_them_from_today()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var person = await (await client.PostAsJsonAsync("/api/people", new
        {
            name = "Marcus",
            relationship = "Friend",
            contactCadenceDays = 7,
        })).Content.ReadFromJsonAsync<PersonDto>();

        // Never contacted + cadence → due.
        var nudges = await client.GetFromJsonAsync<List<NudgeDto>>("/api/people/nudges");
        nudges.Should().ContainSingle(n => n.PersonId == person!.Id);
        nudges!.Single(n => n.PersonId == person!.Id).Prompt.Should().Contain("Marcus");

        // Contact today → no longer due.
        await client.PostAsync($"/api/people/{person!.Id}/contact", null);
        (await client.GetFromJsonAsync<List<NudgeDto>>("/api/people/nudges"))!
            .Should().NotContain(n => n.PersonId == person.Id);
    }

    [Fact]
    public async Task Create_with_a_blank_name_returns_400()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var res = await client.PostAsJsonAsync("/api/people", new { name = "" });
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Add_date_with_an_impossible_day_returns_400()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var person = await (await client.PostAsJsonAsync("/api/people", new { name = "Zoe" }))
            .Content.ReadFromJsonAsync<PersonDto>();

        var res = await client.PostAsJsonAsync($"/api/people/{person!.Id}/dates", new
        {
            label = "Birthday",
            month = 2,
            day = 30,
        });
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Today_carries_the_people_slice_with_the_single_nudge()
    {
        await FaithSeed.EnsureVerseAsync(
            _factory, Today.DayOfYear, "John 3:16", "For God so loved the world...",
            "https://www.bible.com/bible/111/JHN.3.16");
        var client = await _factory.CreateAuthenticatedClientAsync();
        await client.PostAsJsonAsync("/api/people", new
        {
            name = "Natalie",
            relationship = "Wife",
            contactCadenceDays = 2,
        });

        var today = await client.GetFromJsonAsync<System.Text.Json.JsonElement>("/api/today");
        var people = today.GetProperty("people");
        people.GetProperty("nudge").GetProperty("name").GetString().Should().Be("Natalie");
        people.GetProperty("nudge").GetProperty("prompt").GetString().Should().Contain("Natalie");
        people.GetProperty("upcomingDates").GetArrayLength().Should().Be(0);
    }
}
