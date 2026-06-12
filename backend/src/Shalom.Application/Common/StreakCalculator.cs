namespace Shalom.Application.Common;

/// <summary>Result of a streak computation: the live streak and the all-time best.</summary>
public sealed record StreakResult(int Current, int Longest);

/// <summary>
/// Pure, stateless streak math over local calendar days (ADR-004: streaks are
/// derived at read time, never stored; all dates are server-derived
/// America/Toronto <see cref="DateOnly"/> values, so this class never touches
/// clocks or timezones).
///
/// <para><b>Counting.</b> A streak's length is the number of days that actually
/// have activity. Forgiven ("grace") days bridge a streak but never add to it:
/// active Fri + Sat, grace Sun, active Mon is a streak of 3, not 4.</para>
///
/// <para><b>Sabbath grace (default).</b> One missing day per rolling seven does
/// not break a streak: walking along a streak, a missing day is forgiven if the
/// previously forgiven day is at least 7 days away; two misses closer than 7
/// days apart break it (so two consecutive missing days always break it).
/// Additionally, <em>today</em> is never counted against the user while it is
/// still in progress — an unlogged today is simply skipped, costing neither the
/// streak nor the weekly grace allowance.</para>
///
/// <para><b>Current streak.</b> Counted walking backwards from today. Today not
/// yet logged never breaks it; with grace, yesterday may additionally be the
/// week's forgiven day (so on a Monday morning after a quiet Sunday the streak
/// survives), but the streak's most recent activity day can never be more than
/// two days back. Without an activity day reachable that way, current is 0.</para>
///
/// <para><b>Longest streak.</b> The same grace rule applied over all history:
/// the maximum graced chain ending at any activity day. Because the current
/// chain is one of those candidates, <c>Current &lt;= Longest</c> always.</para>
///
/// <para><b>Strict mode.</b> <c>sabbathGrace: false</c> disables the missing-day
/// forgiveness entirely (chains must be strictly consecutive days), but an
/// unlogged today still does not break the current streak — that allowance is
/// about the day not being over, not about grace.</para>
/// </summary>
public static class StreakCalculator
{
    public static StreakResult Calculate(
        IReadOnlySet<DateOnly> activityDates,
        DateOnly today,
        bool sabbathGrace = true)
    {
        ArgumentNullException.ThrowIfNull(activityDates);

        // Dates after today cannot exist (ADR-004: server-derived); drop them defensively.
        var dates = new HashSet<DateOnly>(activityDates.Where(d => d <= today));
        if (dates.Count == 0)
            return new StreakResult(0, 0);

        var current = WalkBack(dates, today, todayInProgress: true, sabbathGrace);

        var longest = current;
        foreach (var date in dates)
        {
            // Only chain ends matter: a chain ending at date+1 strictly contains this one.
            if (dates.Contains(date.AddDays(1)))
                continue;
            var length = WalkBack(dates, date, todayInProgress: false, sabbathGrace);
            if (length > longest)
                longest = length;
        }

        return new StreakResult(current, longest);
    }

    /// <summary>
    /// Counts activity days in the maximal graced chain ending at
    /// <paramref name="start"/>, walking backwards one day at a time.
    /// </summary>
    private static int WalkBack(HashSet<DateOnly> dates, DateOnly start, bool todayInProgress, bool grace)
    {
        var day = start;

        // An unlogged today is in progress, not a miss: skip it for free.
        if (todayInProgress && !dates.Contains(day))
            day = day.AddDays(-1);

        var count = 0;
        DateOnly? lastForgiven = null;

        while (true)
        {
            if (dates.Contains(day))
            {
                count++;
            }
            else if (grace && (lastForgiven is null || lastForgiven.Value.DayNumber - day.DayNumber >= 7))
            {
                lastForgiven = day; // one forgiven miss per rolling seven days
            }
            else
            {
                return count;
            }

            day = day.AddDays(-1);
        }
    }
}
