using FluentAssertions;
using Shalom.Application.Common;
using Shalom.Application.Push;
using Shalom.Domain.Entities;
using Xunit;

namespace Shalom.Application.Tests.Push;

/// <summary>
/// The pure decision core of M10. Fixed stage: the default 16:8 schedule
/// (12:00–20:00, Sunday 13:30–20:30 — ADR-005) on Friday 2026-06-12 unless
/// a case says otherwise.
/// </summary>
public class ReminderPlannerTests
{
    private static readonly DateOnly Friday = new(2026, 6, 12);
    private static readonly DateOnly Sunday = new(2026, 6, 14);

    private static readonly IReadOnlySet<string> NothingSent = new HashSet<string>();

    private static FastingSchedule Schedule() => new()
    {
        Id = Guid.NewGuid(),
        UserId = Guid.NewGuid(),
        EatingWindowStart = new TimeOnly(12, 0),
        EatingWindowEnd = new TimeOnly(20, 0),
        TargetFastHours = 16,
        Overrides =
        {
            new FastingScheduleOverride
            {
                DayOfWeek = DayOfWeek.Sunday,
                EatingWindowStart = new TimeOnly(13, 30),
                EatingWindowEnd = new TimeOnly(20, 30),
            },
        },
    };

    private static ReminderDate Birthday(DateOnly on, int leadDays = 7, string person = "Natalie", string label = "Birthday")
        => new(Guid.NewGuid(), Guid.NewGuid(), person, label, on.Month, on.Day, leadDays);

    private static IReadOnlyList<PlannedReminder> Plan(
        TimeOnly localTime,
        DateOnly? localDate = null,
        IReadOnlyList<ReminderDate>? dates = null,
        IReadOnlySet<string>? sent = null)
        => ReminderPlanner.Plan(
            Schedule(), dates ?? Array.Empty<ReminderDate>(), localDate ?? Friday, localTime, sent ?? NothingSent);

    // ---- (a) window open ---------------------------------------------------

    [Fact]
    public void Window_open_fires_at_the_open_moment_with_the_whisper_copy()
    {
        var due = Plan(new TimeOnly(12, 0));

        var open = due.Should().ContainSingle().Subject;
        open.Kind.Should().Be(ReminderPlanner.KindWindowOpen);
        open.Title.Should().Be("Shalom");
        open.Body.Should().Be("Your window is open — break your fast well.");
        open.Url.Should().Be("/today");
    }

    [Fact]
    public void Window_open_is_not_due_one_minute_before()
    {
        Plan(new TimeOnly(11, 59)).Should().BeEmpty();
    }

    [Fact]
    public void Window_open_fires_at_most_once_per_day()
    {
        var sent = new HashSet<string> { ReminderPlanner.KindWindowOpen };
        Plan(new TimeOnly(12, 5), sent: sent).Should().BeEmpty();
    }

    [Fact]
    public void Window_open_is_stale_after_the_grace_period()
    {
        // A long deploy ate the moment: 12:45+ would be noise, not care.
        Plan(new TimeOnly(12, 44)).Should().ContainSingle(r => r.Kind == ReminderPlanner.KindWindowOpen);
        Plan(new TimeOnly(12, 45)).Should().BeEmpty();
    }

    [Fact]
    public void Sunday_override_moves_the_open_moment_to_family_lunch()
    {
        // 12:30 Sunday: the weekday window would be open, the override says not yet.
        Plan(new TimeOnly(12, 30), Sunday).Should().BeEmpty();
        Plan(new TimeOnly(13, 30), Sunday)
            .Should().ContainSingle(r => r.Kind == ReminderPlanner.KindWindowOpen);
    }

    // ---- (b) window closing -------------------------------------------------

    [Fact]
    public void Closing_warning_fires_45_minutes_before_close_with_the_time_in_the_copy()
    {
        var due = Plan(new TimeOnly(19, 15));

        var closing = due.Should().ContainSingle().Subject;
        closing.Kind.Should().Be(ReminderPlanner.KindWindowClosing);
        closing.Body.Should().Be("Window closes at 20:00 — finish well.");
        closing.Url.Should().Be("/today");
    }

    [Fact]
    public void Closing_warning_is_not_due_46_minutes_out()
    {
        Plan(new TimeOnly(19, 14)).Should().BeEmpty();
    }

    [Fact]
    public void Closing_warning_stays_useful_until_close_and_no_further()
    {
        Plan(new TimeOnly(19, 59)).Should().ContainSingle(r => r.Kind == ReminderPlanner.KindWindowClosing);
        Plan(new TimeOnly(20, 0)).Should().BeEmpty();
    }

    [Fact]
    public void Closing_warning_fires_at_most_once_per_day()
    {
        var sent = new HashSet<string> { ReminderPlanner.KindWindowClosing };
        Plan(new TimeOnly(19, 20), sent: sent).Should().BeEmpty();
    }

    [Fact]
    public void Sunday_closing_warning_uses_the_override_window()
    {
        var due = Plan(new TimeOnly(19, 45), Sunday);
        due.Should().ContainSingle(r => r.Kind == ReminderPlanner.KindWindowClosing)
            .Which.Body.Should().Be("Window closes at 20:30 — finish well.");
    }

    // ---- (c) important dates --------------------------------------------------

    [Fact]
    public void Date_lead_fires_exactly_LeadDays_out()
    {
        var date = Birthday(Friday.AddDays(7));
        var due = Plan(new TimeOnly(9, 0), dates: new[] { date });

        var lead = due.Should().ContainSingle().Subject;
        lead.Kind.Should().Be(ReminderPlanner.KindDateLead(date.Id));
        lead.Body.Should().Be("Birthday for Natalie in 7 days.");
        lead.Url.Should().Be($"/people/{date.PersonId}");
    }

    [Fact]
    public void Date_lead_is_silent_on_every_other_day()
    {
        Plan(new TimeOnly(9, 0), dates: new[] { Birthday(Friday.AddDays(6)) }).Should().BeEmpty();
        Plan(new TimeOnly(9, 0), dates: new[] { Birthday(Friday.AddDays(8)) }).Should().BeEmpty();
    }

    [Fact]
    public void Day_of_fires_with_the_make_it_count_copy()
    {
        var date = Birthday(Friday);
        var due = Plan(new TimeOnly(9, 0), dates: new[] { date });

        var dayOf = due.Should().ContainSingle().Subject;
        dayOf.Kind.Should().Be(ReminderPlanner.KindDateDayOf(date.Id));
        dayOf.Body.Should().Be("It's Natalie's Birthday today — make it count.");
        dayOf.Url.Should().Be($"/people/{date.PersonId}");
    }

    [Fact]
    public void Zero_LeadDays_never_doubles_up_with_day_of()
    {
        var date = Birthday(Friday, leadDays: 0);
        var due = Plan(new TimeOnly(9, 0), dates: new[] { date });

        due.Should().ContainSingle().Which.Kind.Should().Be(ReminderPlanner.KindDateDayOf(date.Id));
    }

    [Fact]
    public void Two_birthdays_on_the_same_day_each_get_their_own_whisper()
    {
        var natalie = Birthday(Friday, person: "Natalie");
        var marcus = Birthday(Friday, person: "Marcus");
        var due = Plan(new TimeOnly(9, 0), dates: new[] { natalie, marcus });

        due.Should().HaveCount(2);
        due.Select(r => r.Kind).Should().BeEquivalentTo(new[]
        {
            ReminderPlanner.KindDateDayOf(natalie.Id),
            ReminderPlanner.KindDateDayOf(marcus.Id),
        });
    }

    [Fact]
    public void Date_kinds_fire_at_most_once_per_day_each()
    {
        var date = Birthday(Friday);
        var sent = new HashSet<string> { ReminderPlanner.KindDateDayOf(date.Id) };

        Plan(new TimeOnly(9, 0), dates: new[] { date }, sent: sent).Should().BeEmpty();
    }

    // ---- quiet hours -----------------------------------------------------------

    [Fact]
    public void Quiet_hours_edges_are_exact()
    {
        var date = Birthday(Friday); // day-of is due all day — perfect probe
        var dates = new[] { date };

        Plan(new TimeOnly(21, 29), dates: dates).Should().ContainSingle();
        Plan(new TimeOnly(21, 30), dates: dates).Should().BeEmpty();
        Plan(new TimeOnly(6, 29), dates: dates).Should().BeEmpty();
        Plan(new TimeOnly(6, 30), dates: dates).Should().ContainSingle();
    }

    [Fact]
    public void Quiet_hours_silence_everything_even_a_due_window_moment()
    {
        var schedule = Schedule();
        schedule.EatingWindowEnd = new TimeOnly(22, 0); // closing warning would land 21:15…22:00

        ReminderPlanner.Plan(schedule, Array.Empty<ReminderDate>(), Friday, new TimeOnly(21, 45), NothingSent)
            .Should().BeEmpty();
    }

    // ---- DST days (America/Toronto, via the same LocalDay helper the scheduler uses) ----

    private sealed class FixedClock : IDateTimeProvider
    {
        public DateTimeOffset UtcNow { get; init; }
        public DateOnly Today => DateOnly.FromDateTime(UtcNow.UtcDateTime);
    }

    [Fact]
    public void Spring_forward_day_maps_utc_to_EDT_so_the_open_moment_is_on_time()
    {
        // 2026-03-08 is a SUNDAY and the spring-forward day: clocks jump
        // 02:00 EST → 03:00 EDT, and the Sunday override opens at 13:30.
        // 17:30Z is 13:30 EDT (UTC-4) — the open moment. Under the stale EST
        // offset it would read 12:30 and the whisper would be wrongly silent.
        var clock = new FixedClock { UtcNow = new DateTimeOffset(2026, 3, 8, 17, 30, 0, TimeSpan.Zero) };
        var localDate = LocalDay.Today(clock);
        var localTime = LocalDay.TimeOf(clock.UtcNow);

        localDate.Should().Be(new DateOnly(2026, 3, 8));
        localDate.DayOfWeek.Should().Be(DayOfWeek.Sunday);
        localTime.Should().Be(new TimeOnly(13, 30));

        ReminderPlanner.Plan(Schedule(), Array.Empty<ReminderDate>(), localDate, localTime, NothingSent)
            .Should().ContainSingle(r => r.Kind == ReminderPlanner.KindWindowOpen);
    }

    [Fact]
    public void Fall_back_day_keeps_the_small_hours_quiet()
    {
        // 2026-11-01: clocks fall back 02:00 EDT → 01:00 EST. 06:15Z is
        // 01:15 EST — quiet hours, even though 06:15Z was 02:15 local the
        // day before.
        var clock = new FixedClock { UtcNow = new DateTimeOffset(2026, 11, 1, 6, 15, 0, TimeSpan.Zero) };
        var localDate = LocalDay.Today(clock);
        var localTime = LocalDay.TimeOf(clock.UtcNow);

        localDate.Should().Be(new DateOnly(2026, 11, 1));
        localTime.Should().Be(new TimeOnly(1, 15));

        ReminderPlanner.Plan(Schedule(), new[] { Birthday(new DateOnly(2026, 11, 1)) }, localDate, localTime, NothingSent)
            .Should().BeEmpty();
    }
}
