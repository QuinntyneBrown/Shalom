using Shalom.Application.Contracts;
using Shalom.Domain.Entities;

namespace Shalom.Application.ImportantDates;

public static class ImportantDateMapping
{
    public static ImportantDateDto ToDto(ImportantDate d, DateOnly today)
    {
        var next = ImportantDateMath.NextOccurrence(d.Month, d.Day, today);
        return new ImportantDateDto(
            d.Id, d.PersonId, d.Label, d.Month, d.Day, d.Year, d.LeadDays,
            next, next.DayNumber - today.DayNumber);
    }
}
