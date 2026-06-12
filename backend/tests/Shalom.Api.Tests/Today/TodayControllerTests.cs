using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Shalom.Api.Tests.Support;
using Shalom.Application.Common;
using Xunit;

namespace Shalom.Api.Tests.Today;

public class TodayControllerTests : IClassFixture<ShalomApiFactory>
{
    private const string PlanName = "Today Test Plan";

    private readonly ShalomApiFactory _factory;
    public TodayControllerTests(ShalomApiFactory factory) { _factory = factory; }

    private record CheckInDto(Guid Id, DateOnly Date, int MoodRating, int SpiritualRating, string? Note);
    private record VerseDto(string Reference, string Text, string YouVersionUrl);
    private record TodayReadingDto(Guid DayId, int DayNumber, string PassageReference, string YouVersionUrl, bool CompletedToday, string PlanName, int CompletedCount, int TotalDays);
    private record TodayStreaksDto(int CheckInCurrent, int CheckInLongest, int ReadingCurrent, int ReadingLongest);
    private record TodayDto(DateOnly Date, string GreetingName, CheckInDto? CheckIn, VerseDto Verse, TodayReadingDto? Reading, TodayStreaksDto Streaks);

    private DateOnly Today => LocalDay.Today(_factory.Clock);

    private async Task SeedAsync()
    {
        await FaithSeed.EnsureVerseAsync(
            _factory, Today.DayOfYear, "John 3:16", "For God so loved the world...",
            "https://www.bible.com/bible/111/JHN.3.16");
        await FaithSeed.EnsureActivePlanAsync(_factory, PlanName, "John 1", "John 2");
    }

    [Fact]
    public async Task Get_today_without_bearer_returns_401()
    {
        var client = _factory.CreateClient();
        var res = await client.GetAsync("/api/today");
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Get_today_composes_date_greeting_verse_reading_and_streaks()
    {
        await SeedAsync();
        var email = $"dawn-{Guid.NewGuid():N}@example.com";
        var client = await _factory.CreateAuthenticatedClientAsync(email);

        var dto = await client.GetFromJsonAsync<TodayDto>("/api/today");

        dto!.Date.Should().Be(Today);
        dto.GreetingName.Should().Be(email[..email.IndexOf('@')]);
        dto.CheckIn.Should().BeNull("no check-in has been logged yet");
        dto.Verse.Reference.Should().Be("John 3:16");
        dto.Verse.YouVersionUrl.Should().StartWith("https://www.bible.com/bible/111/");
        dto.Reading.Should().NotBeNull();
        dto.Reading!.PlanName.Should().Be(PlanName);
        dto.Reading.TotalDays.Should().Be(2);
        dto.Streaks.Should().NotBeNull();
    }

    [Fact]
    public async Task Get_today_reflects_a_saved_check_in_and_streak()
    {
        await SeedAsync();
        var client = await _factory.CreateAuthenticatedClientAsync();

        var put = await client.PutAsJsonAsync("/api/check-ins/today", new { moodRating = 4, spiritualRating = 3, note = "steady" });
        put.StatusCode.Should().Be(HttpStatusCode.OK);

        var dto = await client.GetFromJsonAsync<TodayDto>("/api/today");

        dto!.CheckIn.Should().NotBeNull();
        dto.CheckIn!.MoodRating.Should().Be(4);
        dto.CheckIn.SpiritualRating.Should().Be(3);
        dto.CheckIn.Note.Should().Be("steady");
        dto.Streaks.CheckInCurrent.Should().BeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task Completing_todays_reading_flips_completed_today_and_count()
    {
        await SeedAsync();
        var client = await _factory.CreateAuthenticatedClientAsync();

        var before = await client.GetFromJsonAsync<TodayDto>("/api/today");
        before!.Reading.Should().NotBeNull();
        var dayId = before.Reading!.DayId;

        // Tolerate state left by sibling tests: reset, then complete through the API.
        await client.DeleteAsync($"/api/reading/days/{dayId}/complete");
        var res = await client.PostAsync($"/api/reading/days/{dayId}/complete", content: null);
        res.StatusCode.Should().Be(HttpStatusCode.OK);

        var after = await client.GetFromJsonAsync<TodayDto>("/api/today");
        after!.Reading.Should().NotBeNull();
        after.Reading!.DayId.Should().Be(dayId, "a day completed today remains the surfaced day");
        after.Reading.CompletedToday.Should().BeTrue();
        after.Streaks.ReadingCurrent.Should().BeGreaterThanOrEqualTo(1);

        // Leave the day uncompleted so sibling tests see a stable plan.
        await client.DeleteAsync($"/api/reading/days/{dayId}/complete");
    }
}
