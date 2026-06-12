namespace Shalom.Application.People;

/// <summary>
/// Warm, specific prompt templates per relationship bucket, rotated
/// deterministically by (day-of-year + stable name hash) so the same person
/// sees the same prompt all day and a different one tomorrow. Tone rules
/// are binding: invitations, never obligations — no guilt copy, ever.
/// </summary>
public static class NudgePrompts
{
    private static readonly string[] Spouse =
    [
        "Ask {0} about her day — and really listen.",
        "Tell {0} one thing you appreciated about her this week.",
        "Plan something small for the weekend with {0}.",
    ];

    private static readonly string[] Child =
    [
        "Ask {0} what made her laugh today.",
        "Ask {0} to show you what she's been making lately.",
        "Tell {0} one thing you love about who she's becoming.",
    ];

    private static readonly string[] Default =
    [
        "Send {0} a quick text — no reason needed.",
        "Pray for {0} this morning, then let them know you did.",
        "Voice-note {0} something that reminded you of them.",
    ];

    public static string For(string name, string? relationship, DateOnly today)
    {
        var templates = TemplatesFor(relationship);
        var index = (today.DayOfYear + StableHash(name)) % templates.Length;
        return string.Format(templates[index], name);
    }

    /// <summary>Day-of replacement: an important date today IS the prompt.</summary>
    public static string ForDayOf(string label) => $"It's {label} — make it count.";

    private static string[] TemplatesFor(string? relationship)
    {
        var r = relationship?.ToLowerInvariant() ?? string.Empty;
        if (r.Contains("wife") || r.Contains("husband") || r.Contains("spouse") || r.Contains("partner"))
            return Spouse;
        if (r.Contains("daughter") || r.Contains("son") || r.Contains("child") || r.Contains("kid"))
            return Child;
        return Default;
    }

    /// <summary>
    /// FNV-1a — string.GetHashCode is randomized per process, which would
    /// break the "same prompt all day" guarantee across app restarts.
    /// </summary>
    private static int StableHash(string value)
    {
        unchecked
        {
            var hash = 2166136261u;
            foreach (var c in value)
            {
                hash ^= c;
                hash *= 16777619u;
            }
            return (int)(hash % 1024);
        }
    }
}
