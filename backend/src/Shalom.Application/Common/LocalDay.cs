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
}
