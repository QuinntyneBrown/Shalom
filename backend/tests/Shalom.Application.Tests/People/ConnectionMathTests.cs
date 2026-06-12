using FluentAssertions;
using Shalom.Application.People;
using Xunit;

namespace Shalom.Application.Tests.People;

public class ConnectionMathTests
{
    private static readonly DateOnly Today = new(2026, 6, 12);

    [Fact]
    public void Null_cadence_is_never_auto_due_even_when_never_contacted()
    {
        ConnectionMath.IsDue(lastContactedOn: null, contactCadenceDays: null, snoozedUntil: null, Today)
            .Should().BeFalse();
    }

    [Fact]
    public void Never_contacted_with_a_cadence_is_due()
    {
        ConnectionMath.IsDue(lastContactedOn: null, contactCadenceDays: 7, snoozedUntil: null, Today)
            .Should().BeTrue();
    }

    [Theory]
    [InlineData(7, -7, true)]   // exactly cadence days ago — due today
    [InlineData(7, -8, true)]   // past due
    [InlineData(7, -6, false)]  // not yet
    [InlineData(30, -29, false)]
    [InlineData(30, -30, true)]
    public void Cadence_due_date_is_last_contact_plus_cadence(int cadence, int lastOffset, bool expected)
    {
        ConnectionMath.IsDue(Today.AddDays(lastOffset), cadence, snoozedUntil: null, Today)
            .Should().Be(expected);
    }

    [Fact]
    public void Snoozed_until_tomorrow_is_not_due_today()
    {
        ConnectionMath.IsDue(Today.AddDays(-30), 7, snoozedUntil: Today.AddDays(1), Today)
            .Should().BeFalse();
    }

    [Fact]
    public void A_snooze_that_has_arrived_no_longer_suppresses()
    {
        ConnectionMath.IsDue(Today.AddDays(-30), 7, snoozedUntil: Today, Today)
            .Should().BeTrue();
    }

    [Fact]
    public void Never_contacted_ranks_as_most_overdue()
    {
        ConnectionMath.DaysSinceDue(lastContactedOn: null, 7, Today).Should().Be(int.MaxValue);
    }

    [Fact]
    public void Days_since_due_counts_days_past_the_cadence_date()
    {
        ConnectionMath.DaysSinceDue(Today.AddDays(-10), 7, Today).Should().Be(3);
        ConnectionMath.DaysSinceDue(Today.AddDays(-7), 7, Today).Should().Be(0);
    }
}
