using FluentAssertions;
using Shalom.Application.ImportantDates;
using Xunit;

namespace Shalom.Application.Tests.ImportantDates;

public class ImportantDateMathTests
{
    [Fact]
    public void A_date_later_this_year_resolves_to_this_year()
    {
        var today = new DateOnly(2026, 6, 12);
        ImportantDateMath.NextOccurrence(8, 23, today).Should().Be(new DateOnly(2026, 8, 23));
        ImportantDateMath.DaysUntil(8, 23, today).Should().Be(72);
    }

    [Fact]
    public void Today_is_zero_days_away_not_next_year()
    {
        var today = new DateOnly(2026, 6, 12);
        ImportantDateMath.NextOccurrence(6, 12, today).Should().Be(today);
        ImportantDateMath.DaysUntil(6, 12, today).Should().Be(0);
    }

    [Fact]
    public void A_passed_date_wraps_to_next_year()
    {
        var today = new DateOnly(2026, 6, 12);
        ImportantDateMath.NextOccurrence(2, 11, today).Should().Be(new DateOnly(2027, 2, 11));
    }

    [Fact]
    public void Feb_29_celebrates_on_feb_28_in_a_non_leap_year()
    {
        var today = new DateOnly(2026, 1, 15);
        ImportantDateMath.NextOccurrence(2, 29, today).Should().Be(new DateOnly(2026, 2, 28));
    }

    [Fact]
    public void Feb_29_stays_feb_29_in_a_leap_year()
    {
        var today = new DateOnly(2028, 1, 15);
        ImportantDateMath.NextOccurrence(2, 29, today).Should().Be(new DateOnly(2028, 2, 29));
    }

    [Fact]
    public void Feb_29_already_passed_in_a_non_leap_year_wraps_forward()
    {
        // Mar 1 2026: Feb 28 2026 has passed; 2027 is non-leap → Feb 28 2027.
        var today = new DateOnly(2026, 3, 1);
        ImportantDateMath.NextOccurrence(2, 29, today).Should().Be(new DateOnly(2027, 2, 28));
    }

    [Fact]
    public void Year_end_wrap_counts_across_the_boundary()
    {
        var today = new DateOnly(2026, 12, 30);
        ImportantDateMath.NextOccurrence(1, 2, today).Should().Be(new DateOnly(2027, 1, 2));
        ImportantDateMath.DaysUntil(1, 2, today).Should().Be(3);
    }
}
