using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Shalom.Api.Tests.Support;
using Shalom.Application.Common;
using Xunit;

namespace Shalom.Api.Tests.Reading;

public class ReadingControllerTests : IClassFixture<ShalomApiFactory>
{
    private const string PlanName = "Api Test Plan";

    private readonly ShalomApiFactory _factory;
    public ReadingControllerTests(ShalomApiFactory factory) { _factory = factory; }

    private record ReadingDayDto(Guid Id, int DayNumber, string PassageReference, string YouVersionUrl, DateOnly? CompletedOn);
    private record ReadingPlanDto(Guid Id, string Name, DateOnly StartDate, bool IsActive, int CompletedCount, int TotalDays, List<ReadingDayDto> Days);

    private DateOnly Today => LocalDay.Today(_factory.Clock);

    private Task<IReadOnlyList<Guid>> SeedPlanAsync() =>
        FaithSeed.EnsureActivePlanAsync(_factory, PlanName, "John 1", "John 2", "John 3", "John 4");

    [Fact]
    public async Task Get_plan_without_bearer_returns_401()
    {
        var client = _factory.CreateClient();
        var res = await client.GetAsync("/api/reading/plan");
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Get_plan_returns_the_active_plan_with_ordered_days()
    {
        await SeedPlanAsync();
        var client = await _factory.CreateAuthenticatedClientAsync();

        var plan = await client.GetFromJsonAsync<ReadingPlanDto>("/api/reading/plan");

        plan!.Name.Should().Be(PlanName);
        plan.IsActive.Should().BeTrue();
        plan.TotalDays.Should().Be(4);
        plan.Days.Select(d => d.DayNumber).Should().ContainInOrder(1, 2, 3, 4);
        plan.Days.Select(d => d.PassageReference).Should().Contain("John 1");
    }

    [Fact]
    public async Task Complete_marks_the_day_read_today_and_is_idempotent()
    {
        var dayIds = await SeedPlanAsync();
        var client = await _factory.CreateAuthenticatedClientAsync();
        var dayId = dayIds[2];

        var first = await client.PostAsync($"/api/reading/days/{dayId}/complete", content: null);
        first.StatusCode.Should().Be(HttpStatusCode.OK);
        var dto = await first.Content.ReadFromJsonAsync<ReadingDayDto>();
        dto!.CompletedOn.Should().Be(Today);

        var second = await client.PostAsync($"/api/reading/days/{dayId}/complete", content: null);
        second.StatusCode.Should().Be(HttpStatusCode.OK);
        var repeat = await second.Content.ReadFromJsonAsync<ReadingDayDto>();
        repeat!.CompletedOn.Should().Be(Today, "repeating the call is a no-op success");
    }

    [Fact]
    public async Task Delete_clears_the_completion()
    {
        var dayIds = await SeedPlanAsync();
        var client = await _factory.CreateAuthenticatedClientAsync();
        var dayId = dayIds[3];

        await client.PostAsync($"/api/reading/days/{dayId}/complete", content: null);

        var res = await client.DeleteAsync($"/api/reading/days/{dayId}/complete");
        res.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var plan = await client.GetFromJsonAsync<ReadingPlanDto>("/api/reading/plan");
        plan!.Days.Single(d => d.Id == dayId).CompletedOn.Should().BeNull();
    }

    [Fact]
    public async Task Complete_unknown_day_returns_404()
    {
        await SeedPlanAsync();
        var client = await _factory.CreateAuthenticatedClientAsync();

        var res = await client.PostAsync($"/api/reading/days/{Guid.NewGuid()}/complete", content: null);

        res.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
