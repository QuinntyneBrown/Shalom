using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Shalom.Api.Tests.Support;
using Shalom.Application.Common;
using Xunit;

namespace Shalom.Api.Tests.Meals;

public class MealsControllerTests : IClassFixture<ShalomApiFactory>
{
    private readonly ShalomApiFactory _factory;
    public MealsControllerTests(ShalomApiFactory factory) { _factory = factory; }

    private record MealDto(Guid Id, string Text, List<string> Tags, DateTimeOffset OccurredAt);

    private DateOnly Today => LocalDay.Today(_factory.Clock);

    [Fact]
    public async Task Post_without_bearer_returns_401()
    {
        var client = _factory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/meals", new { text = "toast", tags = Array.Empty<string>() });
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Get_without_bearer_returns_401()
    {
        var client = _factory.CreateClient();
        var res = await client.GetAsync($"/api/meals?from={Today:yyyy-MM-dd}&to={Today:yyyy-MM-dd}");
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Log_then_list_round_trips_the_meal()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();

        var res = await client.PostAsJsonAsync("/api/meals", new
        {
            text = "salmon + greens",
            tags = new[] { "home-cooked", "fish" },
        });
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var dto = await res.Content.ReadFromJsonAsync<MealDto>();
        dto!.Text.Should().Be("salmon + greens");
        dto.Tags.Should().Equal("home-cooked", "fish");

        var list = await client.GetFromJsonAsync<List<MealDto>>(
            $"/api/meals?from={Today.AddDays(-1):yyyy-MM-dd}&to={Today.AddDays(1):yyyy-MM-dd}");
        list.Should().ContainSingle(m => m.Id == dto.Id);
    }

    [Fact]
    public async Task Post_with_a_tag_outside_the_fixed_set_returns_400()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var res = await client.PostAsJsonAsync("/api/meals", new { text = "burger", tags = new[] { "fast-food" } });
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Post_with_empty_text_returns_400()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var res = await client.PostAsJsonAsync("/api/meals", new { text = "", tags = Array.Empty<string>() });
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
