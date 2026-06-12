using FluentAssertions;
using Shalom.Application.Common;
using Shalom.Application.Tests.Support;
using Xunit;

namespace Shalom.Application.Tests.Common;

public class LocalDayTests
{
    private static StubDateTimeProvider ClockAt(DateTimeOffset utcNow) =>
        new() { UtcNow = utcNow };

    [Fact]
    public void Late_evening_in_toronto_is_still_the_same_local_day()
    {
        // 2026-06-13 03:30Z == 2026-06-12 23:30 in Toronto (EDT, UTC-4)
        var clock = ClockAt(new DateTimeOffset(2026, 6, 13, 3, 30, 0, TimeSpan.Zero));
        LocalDay.Today(clock).Should().Be(new DateOnly(2026, 6, 12));
    }

    [Fact]
    public void Just_after_toronto_midnight_rolls_to_the_next_local_day()
    {
        // 2026-06-13 04:30Z == 2026-06-13 00:30 in Toronto (EDT, UTC-4)
        var clock = ClockAt(new DateTimeOffset(2026, 6, 13, 4, 30, 0, TimeSpan.Zero));
        LocalDay.Today(clock).Should().Be(new DateOnly(2026, 6, 13));
    }

    [Fact]
    public void Midday_utc_is_morning_in_toronto_same_day()
    {
        var clock = ClockAt(new DateTimeOffset(2026, 6, 12, 12, 0, 0, TimeSpan.Zero));
        LocalDay.Today(clock).Should().Be(new DateOnly(2026, 6, 12));
    }

    [Fact]
    public void Dst_spring_forward_night_before_midnight_is_previous_day()
    {
        // DST starts 2026-03-08 in Toronto. At 04:59Z Toronto is still on EST
        // (UTC-5), so the local time is 2026-03-07 23:59.
        var clock = ClockAt(new DateTimeOffset(2026, 3, 8, 4, 59, 0, TimeSpan.Zero));
        LocalDay.Today(clock).Should().Be(new DateOnly(2026, 3, 7));
    }

    [Fact]
    public void Dst_spring_forward_morning_is_march_8()
    {
        // 07:30Z on 2026-03-08 lands just after the 2:00 EST -> 3:00 EDT jump:
        // local time is 03:30 EDT, still 2026-03-08.
        var clock = ClockAt(new DateTimeOffset(2026, 3, 8, 7, 30, 0, TimeSpan.Zero));
        LocalDay.Today(clock).Should().Be(new DateOnly(2026, 3, 8));
    }

    [Fact]
    public void Dst_fall_back_keeps_local_date_stable()
    {
        // DST ends 2026-11-01 (2:00 EDT -> 1:00 EST). 05:30Z is 01:30 EDT,
        // already 2026-11-01 locally.
        var clock = ClockAt(new DateTimeOffset(2026, 11, 1, 5, 30, 0, TimeSpan.Zero));
        LocalDay.Today(clock).Should().Be(new DateOnly(2026, 11, 1));
    }

    [Fact]
    public void Honours_an_explicit_timezone_id()
    {
        // 2026-06-13 03:30Z is already June 13 in UTC.
        var clock = ClockAt(new DateTimeOffset(2026, 6, 13, 3, 30, 0, TimeSpan.Zero));
        LocalDay.Today(clock, "UTC").Should().Be(new DateOnly(2026, 6, 13));
    }
}
