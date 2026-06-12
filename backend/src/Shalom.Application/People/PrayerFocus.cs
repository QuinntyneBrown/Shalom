using Shalom.Application.Contracts;
using Shalom.Domain.Entities;

namespace Shalom.Application.People;

/// <summary>
/// The morning ritual's prayer focus: a deterministic day-of-year rotation
/// over the active people (ordered by name so the cycle is stable) plus two
/// fixed focuses — "your church" and "FaithTech". Names always come from
/// data, never hardcoded; the framing line is chosen per relationship
/// bucket in the <see cref="NudgePrompts"/> voice (warm, specific, never an
/// obligation).
/// </summary>
public static class PrayerFocus
{
    public const string ChurchName = "your church";
    public const string FaithTechName = "FaithTech";

    private const string ChurchLine =
        "Pray for its people and its peace — and for the hands that serve quietly.";
    private const string FaithTechLine =
        "Ask for wisdom for the builders and good fruit from the work.";

    public static PrayerFocusDto For(IReadOnlyList<Person> activePeople, DateOnly today)
    {
        var rotation = Rotation(activePeople);
        var (name, line) = rotation[today.DayOfYear % rotation.Count];
        var (tomorrowName, _) = rotation[today.AddDays(1).DayOfYear % rotation.Count];
        return new PrayerFocusDto(name, line, tomorrowName);
    }

    private static List<(string Name, string Line)> Rotation(IReadOnlyList<Person> people)
    {
        var entries = people
            .OrderBy(p => p.Name, StringComparer.OrdinalIgnoreCase)
            .Select(p => (p.Name, LineFor(p.Name, p.Relationship)))
            .ToList();
        entries.Add((ChurchName, ChurchLine));
        entries.Add((FaithTechName, FaithTechLine));
        return entries;
    }

    /// <summary>One warm sentence per relationship bucket (the person's name interpolated where it reads naturally).</summary>
    private static string LineFor(string name, string? relationship)
    {
        var r = relationship?.ToLowerInvariant() ?? string.Empty;
        if (r.Contains("wife") || r.Contains("husband") || r.Contains("spouse") || r.Contains("partner"))
            return "Thank God for her. Ask for one specific thing she's carrying this week.";
        if (r.Contains("daughter") || r.Contains("son") || r.Contains("child") || r.Contains("kid"))
            return $"Pray over who {name} is becoming — courage, kindness, and a heart that knows it is loved.";
        return $"Lift {name} up by name. Ask for one good thing in their week.";
    }
}
