using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Shalom.Api.Tests.Support;
using Shalom.Application.Common;
using Xunit;

namespace Shalom.Api.Tests.Workouts;

public class WorkoutsControllerTests : IClassFixture<ShalomApiFactory>
{
    private readonly ShalomApiFactory _factory;
    public WorkoutsControllerTests(ShalomApiFactory factory) { _factory = factory; }

    private record WorkoutDto(
        Guid Id, string Equipment, DateTimeOffset StartedAt, int DurationMinutes,
        decimal? DistanceKm, int? AvgHeartRateBpm, int? ActiveCalories, string? Notes);

    private DateOnly Today => LocalDay.Today(_factory.Clock);

    [Fact]
    public async Task Post_without_bearer_returns_401()
    {
        var client = _factory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/workouts", new { equipment = "IndoorBike", durationMinutes = 25 });
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Get_without_bearer_returns_401()
    {
        var client = _factory.CreateClient();
        var res = await client.GetAsync($"/api/workouts?from={Today:yyyy-MM-dd}&to={Today:yyyy-MM-dd}");
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Log_then_list_round_trips_the_workout()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();

        var res = await client.PostAsJsonAsync("/api/workouts", new
        {
            equipment = "IndoorBike",
            durationMinutes = 25,
            notes = "effort:steady",
        });
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var dto = await res.Content.ReadFromJsonAsync<WorkoutDto>();
        dto!.Equipment.Should().Be("IndoorBike");
        dto.DurationMinutes.Should().Be(25);
        dto.Notes.Should().Be("effort:steady");

        var list = await client.GetFromJsonAsync<List<WorkoutDto>>(
            $"/api/workouts?from={Today.AddDays(-1):yyyy-MM-dd}&to={Today.AddDays(1):yyyy-MM-dd}");
        list.Should().ContainSingle(w => w.Id == dto.Id);
    }

    [Fact]
    public async Task Post_with_zero_duration_returns_400()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var res = await client.PostAsJsonAsync("/api/workouts", new { equipment = "Treadmill", durationMinutes = 0 });
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Delete_removes_the_workout_and_a_second_delete_is_404()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();

        var created = await (await client.PostAsJsonAsync("/api/workouts",
            new { equipment = "Elliptical", durationMinutes = 20 })).Content.ReadFromJsonAsync<WorkoutDto>();

        (await client.DeleteAsync($"/api/workouts/{created!.Id}")).StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await client.DeleteAsync($"/api/workouts/{created.Id}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Deleting_another_users_workout_returns_404()
    {
        var owner = await _factory.CreateAuthenticatedClientAsync();
        var stranger = await _factory.CreateAuthenticatedClientAsync();

        var created = await (await owner.PostAsJsonAsync("/api/workouts",
            new { equipment = "Treadmill", durationMinutes = 31 })).Content.ReadFromJsonAsync<WorkoutDto>();

        (await stranger.DeleteAsync($"/api/workouts/{created!.Id}")).StatusCode.Should().Be(HttpStatusCode.NotFound);

        var stillThere = await owner.GetFromJsonAsync<List<WorkoutDto>>(
            $"/api/workouts?from={Today.AddDays(-1):yyyy-MM-dd}&to={Today.AddDays(1):yyyy-MM-dd}");
        stillThere.Should().Contain(w => w.Id == created.Id);
    }
}
