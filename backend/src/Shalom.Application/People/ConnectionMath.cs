namespace Shalom.Application.People;

/// <summary>
/// Pure date math for derived connection nudges (ADR-004: nudges are
/// computed at read time, never stored). A person is DUE when:
///
///   - not snoozed (SnoozedUntil null or &lt;= today), AND
///   - they have a cadence (a null cadence is never auto-due), AND
///   - they were never contacted, OR LastContactedOn + cadence &lt;= today.
///
/// No "overdue" ever reaches the UI — these values only rank who is
/// invited first.
/// </summary>
public static class ConnectionMath
{
    public static bool IsDue(
        DateOnly? lastContactedOn,
        int? contactCadenceDays,
        DateOnly? snoozedUntil,
        DateOnly today)
    {
        if (snoozedUntil is { } snoozed && snoozed > today) return false;
        if (contactCadenceDays is not { } cadence) return false;
        if (lastContactedOn is not { } last) return true;
        return last.AddDays(cadence) <= today;
    }

    /// <summary>
    /// Days past the cadence due date, used only to pick the single daily
    /// nudge (largest wins). Never-contacted ranks as most overdue.
    /// </summary>
    public static int DaysSinceDue(DateOnly? lastContactedOn, int contactCadenceDays, DateOnly today)
    {
        if (lastContactedOn is not { } last) return int.MaxValue;
        return today.DayNumber - last.AddDays(contactCadenceDays).DayNumber;
    }
}
