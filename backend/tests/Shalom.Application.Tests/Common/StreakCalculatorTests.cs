using FluentAssertions;
using Shalom.Application.Common;
using Xunit;

namespace Shalom.Application.Tests.Common;

public class StreakCalculatorTests
{
    private static readonly DateOnly Today = new(2026, 6, 12);

    /// <summary>Builds a set of activity dates from offsets back from Today (0 = today).</summary>
    private static IReadOnlySet<DateOnly> Days(params int[] offsetsBack) =>
        offsetsBack.Select(o => Today.AddDays(-o)).ToHashSet();

    [Fact]
    public void Empty_set_yields_zero_zero()
    {
        var result = StreakCalculator.Calculate(new HashSet<DateOnly>(), Today);
        result.Should().Be(new StreakResult(0, 0));
    }

    [Fact]
    public void Only_today_yields_one_one()
    {
        var result = StreakCalculator.Calculate(Days(0), Today);
        result.Should().Be(new StreakResult(1, 1));
    }

    [Fact]
    public void Single_missing_day_is_bridged_by_grace_and_does_not_count()
    {
        // active today, miss yesterday, active the two days before
        var result = StreakCalculator.Calculate(Days(0, 2, 3), Today);
        result.Should().Be(new StreakResult(3, 3)); // grace day bridges, never counts
    }

    [Fact]
    public void Gap_of_two_consecutive_missing_days_breaks()
    {
        var result = StreakCalculator.Calculate(Days(0, 3, 4), Today);
        result.Current.Should().Be(1);
        result.Longest.Should().Be(2);
    }

    [Fact]
    public void Two_grace_gaps_within_one_rolling_week_break_the_streak()
    {
        // misses at t-1 and t-3: only 2 days apart, second one is not forgiven
        var result = StreakCalculator.Calculate(Days(0, 2, 4, 5), Today);
        result.Current.Should().Be(2);  // today + t-2; broken at t-3
        result.Longest.Should().Be(3);  // chain t-2, (t-3 grace), t-4, t-5 seen from its own end
    }

    [Fact]
    public void Grace_gaps_seven_days_apart_are_both_forgiven()
    {
        // 13-day window with misses exactly 7 days apart (t-2 and t-9)
        var offsets = Enumerable.Range(0, 13).Where(o => o != 2 && o != 9).ToArray();
        var result = StreakCalculator.Calculate(Days(offsets), Today);
        result.Should().Be(new StreakResult(11, 11));
    }

    [Fact]
    public void Today_not_yet_logged_never_breaks_current()
    {
        var result = StreakCalculator.Calculate(Days(1, 2, 3), Today);
        result.Current.Should().Be(3);
        result.Longest.Should().Be(3);
    }

    [Fact]
    public void Yesterday_may_be_the_graced_day_while_today_is_in_progress()
    {
        // Monday-morning scenario: quiet Sunday (grace), unlogged Monday (in progress)
        var result = StreakCalculator.Calculate(Days(2, 3), Today);
        result.Current.Should().Be(2);
    }

    [Fact]
    public void Last_activity_three_days_back_resets_current_but_not_longest()
    {
        var result = StreakCalculator.Calculate(Days(3, 4), Today);
        result.Current.Should().Be(0);
        result.Longest.Should().Be(2);
    }

    [Fact]
    public void Longest_remembers_history_current_does_not()
    {
        // a 10-day run weeks ago, then a lone check-in today
        var offsets = Enumerable.Range(11, 10).Append(0).ToArray();
        var result = StreakCalculator.Calculate(Days(offsets), Today);
        result.Current.Should().Be(1);
        result.Longest.Should().Be(10);
    }

    [Fact]
    public void Weekly_activity_does_not_chain_through_grace()
    {
        // grace bridges single-day gaps only; six missing days never bridge
        var result = StreakCalculator.Calculate(Days(0, 7, 14), Today);
        result.Should().Be(new StreakResult(1, 1));
    }

    [Fact]
    public void Strict_mode_breaks_on_any_missing_day()
    {
        var result = StreakCalculator.Calculate(Days(0, 2, 3), Today, sabbathGrace: false);
        result.Current.Should().Be(1);
        result.Longest.Should().Be(2);
    }

    [Fact]
    public void Strict_mode_still_tolerates_unlogged_today()
    {
        var result = StreakCalculator.Calculate(Days(1, 2), Today, sabbathGrace: false);
        result.Current.Should().Be(2);
        result.Longest.Should().Be(2);
    }

    [Fact]
    public void Strict_mode_gives_no_grace_to_yesterday()
    {
        var result = StreakCalculator.Calculate(Days(2, 3), Today, sabbathGrace: false);
        result.Current.Should().Be(0);
        result.Longest.Should().Be(2);
    }

    [Fact]
    public void Dates_spanning_dst_transition_are_plain_date_math()
    {
        // North American DST starts 2026-03-08; DateOnly arithmetic must not care.
        var dstToday = new DateOnly(2026, 3, 9);
        var dates = new HashSet<DateOnly>
        {
            new(2026, 3, 6), new(2026, 3, 7), new(2026, 3, 8), new(2026, 3, 9),
        };
        var result = StreakCalculator.Calculate(dates, dstToday);
        result.Should().Be(new StreakResult(4, 4));
    }

    [Fact]
    public void Future_dates_are_ignored()
    {
        var dates = new HashSet<DateOnly> { Today, Today.AddDays(3) };
        var result = StreakCalculator.Calculate(dates, Today);
        result.Should().Be(new StreakResult(1, 1));
    }

    [Fact]
    public void Current_never_exceeds_longest()
    {
        // misses at t-1 and t-4 (< 7 apart): current consumes grace on t-1 and
        // breaks at t-4, while the full graced chain from t-2 reaches further back.
        var result = StreakCalculator.Calculate(Days(2, 3, 5, 6, 7), Today);
        result.Current.Should().Be(2);
        result.Longest.Should().Be(5);
        result.Current.Should().BeLessThanOrEqualTo(result.Longest);
    }
}
