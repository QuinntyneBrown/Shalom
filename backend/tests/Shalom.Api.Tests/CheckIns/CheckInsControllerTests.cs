using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Shalom.Api.Tests.Support;
using Shalom.Application.Common;
using Xunit;

namespace Shalom.Api.Tests.CheckIns;

public class CheckInsControllerTests : IClassFixture<ShalomApiFactory>
{
    private readonly ShalomApiFactory _factory;
    public CheckInsControllerTests(ShalomApiFactory factory) { _factory = factory; }

    private record UpsertRequest(int MoodRating, int SpiritualRating, string? Note);
    private record CheckInDto(Guid Id, DateOnly Date, int MoodRating, int SpiritualRating, string? Note);

    private DateOnly Today => LocalDay.Today(_factory.Clock);

    [Fact]
    public async Task Put_today_without_bearer_returns_401()
    {
        var client = _factory.CreateClient();
        var res = await client.PutAsJsonAsync("/api/check-ins/today", new UpsertRequest(3, 3, null));
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Get_without_bearer_returns_401()
    {
        var client = _factory.CreateClient();
        var res = await client.GetAsync("/api/check-ins?from=2026-06-01&to=2026-06-30");
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Put_today_creates_todays_check_in()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();

        var res = await client.PutAsJsonAsync("/api/check-ins/today", new UpsertRequest(4, 3, "calm morning"));

        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var dto = await res.Content.ReadFromJsonAsync<CheckInDto>();
        dto!.Date.Should().Be(Today);
        dto.MoodRating.Should().Be(4);
        dto.SpiritualRating.Should().Be(3);
        dto.Note.Should().Be("calm morning");
    }

    [Fact]
    public async Task Put_today_twice_updates_the_same_row()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();

        var first = await (await client.PutAsJsonAsync("/api/check-ins/today", new UpsertRequest(2, 2, "before")))
            .Content.ReadFromJsonAsync<CheckInDto>();
        var second = await (await client.PutAsJsonAsync("/api/check-ins/today", new UpsertRequest(5, 4, "after")))
            .Content.ReadFromJsonAsync<CheckInDto>();

        second!.Id.Should().Be(first!.Id);
        second.MoodRating.Should().Be(5);
        second.Note.Should().Be("after");

        var list = await client.GetFromJsonAsync<List<CheckInDto>>($"/api/check-ins?from={Today:yyyy-MM-dd}&to={Today:yyyy-MM-dd}");
        list.Should().ContainSingle().Which.MoodRating.Should().Be(5);
    }

    [Fact]
    public async Task Put_today_with_out_of_range_rating_returns_400()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();

        var res = await client.PutAsJsonAsync("/api/check-ins/today", new UpsertRequest(9, 3, null));

        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Get_returns_check_ins_inside_the_range_only()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        await client.PutAsJsonAsync("/api/check-ins/today", new UpsertRequest(3, 3, null));

        var inside = await client.GetFromJsonAsync<List<CheckInDto>>(
            $"/api/check-ins?from={Today.AddDays(-7):yyyy-MM-dd}&to={Today:yyyy-MM-dd}");
        var outside = await client.GetFromJsonAsync<List<CheckInDto>>(
            $"/api/check-ins?from={Today.AddDays(-14):yyyy-MM-dd}&to={Today.AddDays(-8):yyyy-MM-dd}");

        inside.Should().ContainSingle(c => c.Date == Today);
        outside.Should().BeEmpty();
    }
}
