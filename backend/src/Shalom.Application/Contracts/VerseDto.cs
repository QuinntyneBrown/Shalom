namespace Shalom.Application.Contracts;

/// <summary>Verse of the day (World English Bible text + YouVersion deep link).</summary>
public record VerseDto(string Reference, string Text, string YouVersionUrl);
