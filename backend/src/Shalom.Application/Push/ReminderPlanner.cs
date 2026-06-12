using System.Globalization;
using Shalom.Application.Fasting;
using Shalom.Application.ImportantDates;
using Shalom.Domain.Entities;

namespace Shalom.Application.Push;

/// <summary>One reminder the planner decided is due right now.</summary>
public sealed record PlannedReminder(string Kind, string Title, string Body, string Url);

/// <summary>An important date as the planner sees it (person already joined).</summary>
public sealed record ReminderDate(
    Guid Id,
    Guid PersonId,
    string PersonName,
    string Label,
    int Month,
    int Day,
    int LeadDays);

/// <summary>
/// The pure decision core of M10 reminders: given the fasting schedule
/// (weekday overrides included), the important dates, the local moment and
/// the kinds already sent today, returns what is due RIGHT NOW. Whisper
/// philosophy: only three genuinely time-sensitive moments, each at most
/// once per day, and total silence during quiet hours (21:30–06:30 — the
/// night models rest, not hustle).
///
/// The scheduler owns clocks, persistence and delivery; everything testable
/// lives here.
/// </summary>
public static class ReminderPlanner
{
    public const string KindWindowOpen = "window-open";
    public const string KindWindowClosing = "window-closing";

    public static readonly TimeOnly QuietHoursStart = new(21, 30);
    public static readonly TimeOnly QuietHoursEnd = new(6, 30);

    /// <summary>Minutes before the window closes that the heads-up fires.</summary>
    public const int ClosingLeadMinutes = 45;

    /// <summary>
    /// How long after the window opens the "open" whisper is still worth
    /// sending. Past this (an API restart, a long deploy) the moment is
    /// gone — a 6pm "break your fast well" would be noise, not care.
    /// </summary>
    public const int OpenGraceMinutes = 45;

    public static string KindDateLead(Guid importantDateId) => $"date-lead:{importantDateId}";
    public static string KindDateDayOf(Guid importantDateId) => $"date-day:{importantDateId}";

    public static IReadOnlyList<PlannedReminder> Plan(
        FastingSchedule schedule,
        IReadOnlyList<ReminderDate> importantDates,
        DateOnly localDate,
        TimeOnly localTime,
        IReadOnlySet<string> alreadySentKinds)
    {
        // Quiet hours gate everything — date reminders simply wait for 06:30.
        if (localTime >= QuietHoursStart || localTime < QuietHoursEnd)
            return Array.Empty<PlannedReminder>();

        var due = new List<PlannedReminder>();
        var window = FastingMapping.TodayWindowFor(schedule, localDate);
        var closingAt = window.End.AddMinutes(-ClosingLeadMinutes);

        // (a) The window just opened. Suppressed once inside the closing
        // band so a very short window never taps twice in one breath.
        if (!alreadySentKinds.Contains(KindWindowOpen)
            && localTime >= window.Start
            && localTime < window.Start.AddMinutes(OpenGraceMinutes)
            && localTime < closingAt)
        {
            due.Add(new PlannedReminder(
                KindWindowOpen,
                "Shalom",
                "Your window is open — break your fast well.",
                "/today"));
        }

        // (b) Heads-up 45 minutes before close, useful until close itself.
        if (!alreadySentKinds.Contains(KindWindowClosing)
            && localTime >= closingAt
            && localTime < window.End)
        {
            due.Add(new PlannedReminder(
                KindWindowClosing,
                "Shalom",
                $"Window closes at {window.End.ToString("HH':'mm", CultureInfo.InvariantCulture)} — finish well.",
                "/today"));
        }

        // (c) Important dates: a week's-notice whisper at LeadDays out, and
        // the day itself. Date facts, so they fire at the first non-quiet
        // tick of the day.
        foreach (var date in importantDates)
        {
            var daysUntil = ImportantDateMath.DaysUntil(date.Month, date.Day, localDate);
            var url = $"/people/{date.PersonId}";

            if (date.LeadDays > 0
                && daysUntil == date.LeadDays
                && !alreadySentKinds.Contains(KindDateLead(date.Id)))
            {
                due.Add(new PlannedReminder(
                    KindDateLead(date.Id),
                    "Shalom",
                    $"{date.Label} for {date.PersonName} in {date.LeadDays} days.",
                    url));
            }

            if (daysUntil == 0 && !alreadySentKinds.Contains(KindDateDayOf(date.Id)))
            {
                due.Add(new PlannedReminder(
                    KindDateDayOf(date.Id),
                    "Shalom",
                    $"It's {date.PersonName}'s {date.Label} today — make it count.",
                    url));
            }
        }

        return due;
    }
}
