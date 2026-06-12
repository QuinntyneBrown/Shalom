namespace Shalom.Application.Meals;

/// <summary>
/// The fixed meal-tag vocabulary ("patterns, not calories"). Stored
/// comma-joined on <see cref="Shalom.Domain.Entities.MealEntry.Tags"/>;
/// validated against this set so the data never drifts into a folksonomy.
/// </summary>
public static class MealTags
{
    public static readonly IReadOnlyList<string> All =
        ["home-cooked", "fish", "veggie", "takeout", "late-night"];

    public static bool IsValid(string tag) => All.Contains(tag, StringComparer.Ordinal);

    public static string Join(IEnumerable<string> tags) => string.Join(',', tags);

    public static IReadOnlyList<string> Split(string joined) =>
        joined.Length == 0 ? [] : joined.Split(',');
}
