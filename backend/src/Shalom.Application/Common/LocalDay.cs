namespace Shalom.Application.Common;

/// <summary>
/// Derives the local calendar date ("today") in a given timezone from the UTC
/// clock. Per ADR-004, every per-day fact is a <see cref="DateOnly"/> derived
/// server-side in America/Toronto — clients never send "today". IANA ids work
/// on Windows (.NET maps them via ICU).
/// </summary>
public static class LocalDay
{
    public const string DefaultTimeZoneId = "America/Toronto";

    public static DateOnly Today(IDateTimeProvider clock, string timeZoneId = DefaultTimeZoneId)
    {
        var zone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        var local = TimeZoneInfo.ConvertTime(clock.UtcNow, zone);
        return DateOnly.FromDateTime(local.DateTime);
    }

    /// <summary>The local calendar date a UTC timestamp falls on (e.g. a fast ended 00:30Z lands on the previous Toronto day).</summary>
    public static DateOnly DateOf(DateTimeOffset timestamp, string timeZoneId = DefaultTimeZoneId)
    {
        var zone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        var local = TimeZoneInfo.ConvertTime(timestamp, zone);
        return DateOnly.FromDateTime(local.DateTime);
    }

    /// <summary>The local time-of-day of a UTC timestamp, for eating-window comparisons.</summary>
    public static TimeOnly TimeOf(DateTimeOffset timestamp, string timeZoneId = DefaultTimeZoneId)
    {
        var zone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        var local = TimeZoneInfo.ConvertTime(timestamp, zone);
        return TimeOnly.FromDateTime(local.DateTime);
    }

    /// <summary>
    /// UTC instant at which the given local day starts (00:00 local). DST-safe:
    /// the offset is resolved for that specific midnight.
    /// </summary>
    public static DateTimeOffset StartOfDayUtc(DateOnly day, string timeZoneId = DefaultTimeZoneId)
    {
        var zone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        var localMidnight = day.ToDateTime(TimeOnly.MinValue);
        return new DateTimeOffset(localMidnight, zone.GetUtcOffset(localMidnight));
    }

    /// <summary>UTC instant at which the given local day ends (exclusive — the next day's local midnight).</summary>
    public static DateTimeOffset EndOfDayUtcExclusive(DateOnly day, string timeZoneId = DefaultTimeZoneId)
        => StartOfDayUtc(day.AddDays(1), timeZoneId);
}
