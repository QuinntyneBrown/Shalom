using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Shalom.Api.Tests.Support;
using Shalom.Application.Common;
using Xunit;

namespace Shalom.Api.Tests.Fasting;

public class FastingControllerTests : IClassFixture<ShalomApiFactory>
{
    private readonly ShalomApiFactory _factory;
    public FastingControllerTests(ShalomApiFactory factory) { _factory = factory; }

    // Enums arrive as strings (JsonStringEnumConverter); the test client
    // reads them as strings rather than registering converters.
    private record OverrideDto(string DayOfWeek, TimeOnly EatingWindowStart, TimeOnly EatingWindowEnd);
    private record WindowDto(TimeOnly Start, TimeOnly End);
    private record ScheduleDto(
        TimeOnly EatingWindowStart, TimeOnly EatingWindowEnd, int TargetFastHours,
        string TimeZoneId, List<OverrideDto> Overrides, WindowDto TodayWindow);
    private record SessionDto(
        Guid Id, DateTimeOffset StartedAt, int TargetHours, DateTimeOffset? EndedAt,
        double ElapsedHours, string? Outcome);
    private record CurrentDto(SessionDto? Current, ScheduleDto Schedule);

    private DateOnly Today => LocalDay.Today(_factory.Clock);

    [Fact]
    public async Task Get_current_without_bearer_returns_401()
    {
        var client = _factory.CreateClient();
        (await client.GetAsync("/api/fasting/current")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Start_without_bearer_returns_401()
    {
        var client = _factory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/fasting/start", new { });
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Get_current_lazily_creates_the_default_schedule()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();

        var dto = await client.GetFromJsonAsync<CurrentDto>("/api/fasting/current");

        dto!.Current.Should().BeNull();
        dto.Schedule.TargetFastHours.Should().Be(16);
        dto.Schedule.EatingWindowStart.Should().Be(new TimeOnly(12, 0));
        dto.Schedule.EatingWindowEnd.Should().Be(new TimeOnly(20, 0));
        dto.Schedule.TimeZoneId.Should().Be("America/Toronto");
        dto.Schedule.Overrides.Should().ContainSingle().Which.DayOfWeek.Should().Be("Sunday");
    }

    [Fact]
    public async Task Start_then_start_again_conflicts_then_end_derives_the_outcome()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();

        var started = await client.PostAsJsonAsync("/api/fasting/start", new { });
        started.StatusCode.Should().Be(HttpStatusCode.OK);
        var session = await started.Content.ReadFromJsonAsync<SessionDto>();
        session!.TargetHours.Should().Be(16);
        session.EndedAt.Should().BeNull();
        session.Outcome.Should().BeNull();

        var again = await client.PostAsJsonAsync("/api/fasting/start", new { });
        again.StatusCode.Should().Be(HttpStatusCode.Conflict);

        var ended = await client.PostAsync("/api/fasting/current/end", content: null);
        ended.StatusCode.Should().Be(HttpStatusCode.OK);
        var endedDto = await ended.Content.ReadFromJsonAsync<SessionDto>();
        endedDto!.Id.Should().Be(session.Id);
        endedDto.EndedAt.Should().NotBeNull();
        endedDto.Outcome.Should().Be("EndedEarly", "the fake clock froze elapsed at zero");

        var history = await client.GetFromJsonAsync<List<SessionDto>>(
            $"/api/fasting/history?from={Today.AddDays(-1):yyyy-MM-dd}&to={Today:yyyy-MM-dd}");
        history.Should().ContainSingle(s => s.Id == session.Id && s.Outcome == "EndedEarly");
    }

    [Fact]
    public async Task End_with_no_open_fast_returns_404()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();
        var res = await client.PostAsync("/api/fasting/current/end", content: null);
        res.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Start_with_an_explicit_target_uses_it()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();

        var res = await client.PostAsJsonAsync("/api/fasting/start", new { targetHours = 18 });

        res.StatusCode.Should().Be(HttpStatusCode.OK);
        (await res.Content.ReadFromJsonAsync<SessionDto>())!.TargetHours.Should().Be(18);
    }

    [Fact]
    public async Task Put_schedule_updates_window_target_and_overrides()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();

        var res = await client.PutAsJsonAsync("/api/fasting/schedule", new
        {
            windowStart = "11:00:00",
            windowEnd = "19:00:00",
            targetFastHours = 17,
            overrides = new[]
            {
                new { dayOfWeek = "Sunday", eatingWindowStart = "13:30:00", eatingWindowEnd = "20:30:00" },
            },
        });

        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var dto = await res.Content.ReadFromJsonAsync<ScheduleDto>();
        dto!.EatingWindowStart.Should().Be(new TimeOnly(11, 0));
        dto.TargetFastHours.Should().Be(17);
        dto.Overrides.Should().ContainSingle().Which.DayOfWeek.Should().Be("Sunday");
    }

    [Fact]
    public async Task Put_schedule_with_an_inverted_window_returns_400()
    {
        var client = await _factory.CreateAuthenticatedClientAsync();

        var res = await client.PutAsJsonAsync("/api/fasting/schedule", new
        {
            windowStart = "20:00:00",
            windowEnd = "12:00:00",
            targetFastHours = 16,
            overrides = Array.Empty<object>(),
        });

        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
