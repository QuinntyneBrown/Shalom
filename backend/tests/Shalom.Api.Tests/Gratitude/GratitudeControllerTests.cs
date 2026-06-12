using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Shalom.Api.Tests.Support;
using Shalom.Application.Common;
using Xunit;

namespace Shalom.Api.Tests.Gratitude;

public class GratitudeControllerTests : IClassFixture<ShalomApiFactory>
{
    private readonly ShalomApiFactory _factory;
    public GratitudeControllerTests(ShalomApiFactory factory) { _factory = factory; }

    private record PersonDto(Guid Id, string Name);
    private record EntryDto(Guid Id, Guid? PersonId, string Text, string OccurredOn);

    [Fact]
    public async Task Gratitude_without_bearer_returns_401()
    {
        var client = _factory.CreateClient();
        (await client.GetAsync("/api/gratitude")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await client.PostAsJsonAsync("/api/gratitude", new { text = "x" })).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Add_and_list_with_and_without_a_person_filter()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var person = await (await client.PostAsJsonAsync("/api/people", new { name = "Natalie" }))
            .Content.ReadFromJsonAsync<PersonDto>();

        var linked = await (await client.PostAsJsonAsync("/api/gratitude", new
        {
            text = "The way she prayed with the girls.",
            personId = person!.Id,
        })).Content.ReadFromJsonAsync<EntryDto>();
        linked!.PersonId.Should().Be(person.Id);
        linked.OccurredOn.Should().Be(LocalDay.Today(_factory.Clock).ToString("yyyy-MM-dd"));

        var unlinked = await (await client.PostAsJsonAsync("/api/gratitude", new { text = "Sunrise." }))
            .Content.ReadFromJsonAsync<EntryDto>();
        unlinked!.PersonId.Should().BeNull();

        var forPerson = await client.GetFromJsonAsync<List<EntryDto>>($"/api/gratitude?personId={person.Id}");
        forPerson.Should().ContainSingle(e => e.Id == linked.Id);
        forPerson.Should().NotContain(e => e.Id == unlinked.Id);

        var all = await client.GetFromJsonAsync<List<EntryDto>>("/api/gratitude?take=50");
        all.Should().Contain(e => e.Id == linked.Id).And.Contain(e => e.Id == unlinked.Id);
    }

    [Fact]
    public async Task Add_with_an_unknown_person_returns_404()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var res = await client.PostAsJsonAsync("/api/gratitude", new
        {
            text = "note",
            personId = Guid.NewGuid(),
        });
        res.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Add_with_empty_text_returns_400()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var res = await client.PostAsJsonAsync("/api/gratitude", new { text = "" });
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
