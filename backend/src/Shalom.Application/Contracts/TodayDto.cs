namespace Shalom.Application.Contracts;

/// <summary>
/// The aggregate powering the Today dashboard in one round trip (and the
/// single offline-cached resource).
///
/// Versioning rule: each pillar nests its own object (checkIn, verse,
/// reading, streaks) so later pillars — fasting, workout, people — arrive as
/// new nullable properties without changing any existing shape.
/// </summary>
public record TodayDto(
    DateOnly Date,
    string GreetingName,
    CheckInDto? CheckIn,
    VerseDto Verse,
    TodayReadingDto? Reading,
    TodayStreaksDto Streaks,
    TodayFastingDto Fasting,
    TodayHealthDto Health,
    TodayPeopleDto People,
    bool RitualCompletedToday);
