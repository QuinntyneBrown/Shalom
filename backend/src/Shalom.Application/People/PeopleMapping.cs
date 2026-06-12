using Shalom.Application.Contracts;
using Shalom.Domain.Entities;

namespace Shalom.Application.People;

public static class PeopleMapping
{
    public static PersonDto ToDto(Person p) => new(
        p.Id, p.Name, p.Relationship, p.Phone,
        p.ContactCadenceDays, p.Notes, p.LastContactedOn, p.SnoozedUntil);
}
