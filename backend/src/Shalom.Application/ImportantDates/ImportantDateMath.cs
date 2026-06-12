namespace Shalom.Application.ImportantDates;

/// <summary>
/// Pure recurrence math for important dates. The next occurrence is this
/// year's instance when it hasn't passed, otherwise next year's. Feb 29
/// resolves to Feb 28 in non-leap years (the celebration doesn't skip).
/// </summary>
public static class ImportantDateMath
{
    public static DateOnly NextOccurrence(int month, int day, DateOnly today)
    {
        var thisYear = OccurrenceInYear(month, day, today.Year);
        return thisYear >= today ? thisYear : OccurrenceInYear(month, day, today.Year + 1);
    }

    public static int DaysUntil(int month, int day, DateOnly today)
        => NextOccurrence(month, day, today).DayNumber - today.DayNumber;

    private static DateOnly OccurrenceInYear(int month, int day, int year)
    {
        if (month == 2 && day == 29 && !DateTime.IsLeapYear(year))
            return new DateOnly(year, 2, 28);
        return new DateOnly(year, month, day);
    }
}
