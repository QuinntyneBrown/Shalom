using FluentAssertions;
using Shalom.Application.People;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.People;

/// <summary>
/// The prayer-focus rotation: deterministic by day-of-year over the active
/// people (ordered by name) plus the two fixed focuses, with a warm framing
/// line per relationship bucket — names always interpolated from data.
/// </summary>
public class PrayerFocusTests
{
    private static Person Person(string name, string? relationship = null) => new()
    {
        Id = Guid.NewGuid(),
        UserId = Guid.NewGuid(),
        Name = name,
        Relationship = relationship,
    };

    [Fact]
    public void Rotates_over_people_by_name_then_church_then_faithtech_by_day_of_year()
    {
        var people = new[]
        {
            Person("Vanessa", "Wife"),
            Person("Olivia", "Daughter"),
            Person("Makayla", "Daughter"),
        };

        // Rotation order: Makayla, Olivia, Vanessa, your church, FaithTech (5 entries).
        // Jan 1 = day 1 → index 1 % 5 = 1 → Olivia.
        var names = Enumerable.Range(0, 5)
            .Select(offset => PrayerFocus.For(people, new DateOnly(2026, 1, 1).AddDays(offset)).Name)
            .ToList();

        names.Should().Equal("Olivia", "Vanessa", PrayerFocus.ChurchName, PrayerFocus.FaithTechName, "Makayla");
    }

    [Fact]
    public void Same_day_always_yields_the_same_focus()
    {
        var people = new[] { Person("Vanessa", "Wife"), Person("Olivia", "Daughter") };
        var today = new DateOnly(2026, 6, 12);

        var first = PrayerFocus.For(people, today);
        var second = PrayerFocus.For(people, today);

        second.Should().Be(first);
    }

    [Fact]
    public void Tomorrow_name_is_the_next_entry_in_the_rotation()
    {
        var people = new[] { Person("Vanessa", "Wife") };
        var today = new DateOnly(2026, 6, 12);

        var focus = PrayerFocus.For(people, today);
        var tomorrow = PrayerFocus.For(people, today.AddDays(1));

        focus.TomorrowName.Should().Be(tomorrow.Name);
        focus.TomorrowName.Should().NotBe(focus.Name, "a 3-entry rotation never repeats on consecutive days");
    }

    [Fact]
    public void Spouse_bucket_gets_the_specific_carrying_line()
    {
        var people = new[] { Person("Vanessa", "Wife") };

        // Walk a few days until Vanessa is the focus.
        var focus = Enumerable.Range(0, 3)
            .Select(offset => PrayerFocus.For(people, new DateOnly(2026, 6, 12).AddDays(offset)))
            .First(f => f.Name == "Vanessa");

        focus.Line.Should().Be("Thank God for her. Ask for one specific thing she's carrying this week.");
    }

    [Fact]
    public void Child_and_default_buckets_interpolate_the_persons_name()
    {
        var daughter = new[] { Person("Olivia", "Daughter") };
        var friend = new[] { Person("Marcus", "Friend") };

        var daughterFocus = Enumerable.Range(0, 3)
            .Select(offset => PrayerFocus.For(daughter, new DateOnly(2026, 6, 12).AddDays(offset)))
            .First(f => f.Name == "Olivia");
        var friendFocus = Enumerable.Range(0, 3)
            .Select(offset => PrayerFocus.For(friend, new DateOnly(2026, 6, 12).AddDays(offset)))
            .First(f => f.Name == "Marcus");

        daughterFocus.Line.Should().Contain("Olivia");
        friendFocus.Line.Should().Contain("Marcus");
    }

    [Fact]
    public void No_people_still_rotates_over_the_two_fixed_focuses()
    {
        var today = new DateOnly(2026, 6, 12); // day 163 → 163 % 2 = 1 → FaithTech.

        var focus = PrayerFocus.For([], today);

        focus.Name.Should().Be(PrayerFocus.FaithTechName);
        focus.TomorrowName.Should().Be(PrayerFocus.ChurchName);
        focus.Line.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void Year_end_rollover_keeps_the_rotation_defined()
    {
        var people = new[] { Person("Vanessa", "Wife") };

        var dec31 = PrayerFocus.For(people, new DateOnly(2026, 12, 31));
        var jan1 = PrayerFocus.For(people, new DateOnly(2027, 1, 1));

        dec31.TomorrowName.Should().Be(jan1.Name, "TomorrowName must follow the day-of-year of the actual next day");
    }
}
