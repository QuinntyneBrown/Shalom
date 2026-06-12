namespace Shalom.Application.Contracts;

/// <summary>
/// Today's prayer focus for the morning ritual: a deterministic rotation
/// over the active people plus two fixed focuses ("your church",
/// "FaithTech") keyed by day-of-year, with a warm one-sentence framing per
/// relationship bucket. <paramref name="TomorrowName"/> powers the evening
/// "Tomorrow" glance without a second round trip.
/// </summary>
public record PrayerFocusDto(string Name, string Line, string TomorrowName);
