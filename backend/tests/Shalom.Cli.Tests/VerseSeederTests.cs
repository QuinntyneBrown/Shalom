using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Shalom.Cli.Seed;
using Xunit;

namespace Shalom.Cli.Tests;

public class VerseSeederTests : IDisposable
{
    private readonly string _dir;

    public VerseSeederTests()
    {
        _dir = Path.Combine(Path.GetTempPath(), "shalom-cli-tests-" + Guid.NewGuid());
        Directory.CreateDirectory(_dir);
    }

    public void Dispose()
    {
        if (Directory.Exists(_dir)) Directory.Delete(_dir, recursive: true);
    }

    private SeedCommandHandler CreateHandler(Shalom.Infrastructure.Persistence.AppDbContext db) =>
        new(new StubPathResolver(_dir), new IJsonSeeder[] { new VerseSeeder() }, db,
            NullLogger<SeedCommandHandler>.Instance);

    private async Task WriteVersesFile(string json) =>
        await File.WriteAllTextAsync(Path.Combine(_dir, "verses-web.json"), json);

    [Fact]
    public async Task Seeds_verses_from_file()
    {
        await WriteVersesFile("""
            [
              { "dayOfYear": 1, "reference": "Genesis 1:1", "text": "In the beginning, God created the heavens and the earth.", "youVersionUrl": "https://www.bible.com/bible/111/GEN.1.1" },
              { "dayOfYear": 2, "reference": "John 3:16", "text": "For God so loved the world...", "youVersionUrl": "https://www.bible.com/bible/111/JHN.3.16" }
            ]
            """);

        using var db = TestDb.Create();
        (await CreateHandler(db).ExecuteAsync(null, default)).Should().Be(0);

        (await db.VersesOfDay.CountAsync()).Should().Be(2);
        var verse = await db.VersesOfDay.SingleAsync(v => v.DayOfYear == 1);
        verse.Reference.Should().Be("Genesis 1:1");
        verse.Text.Should().StartWith("In the beginning");
    }

    [Fact]
    public async Task Reseeding_is_idempotent_counts_stay_stable()
    {
        await WriteVersesFile("""
            [
              { "dayOfYear": 1, "reference": "Genesis 1:1", "text": "In the beginning, God created the heavens and the earth.", "youVersionUrl": "https://www.bible.com/bible/111/GEN.1.1" },
              { "dayOfYear": 2, "reference": "John 3:16", "text": "For God so loved the world...", "youVersionUrl": "https://www.bible.com/bible/111/JHN.3.16" },
              { "dayOfYear": 3, "reference": "Psalm 23:1", "text": "Yahweh is my shepherd; I shall lack nothing.", "youVersionUrl": "https://www.bible.com/bible/111/PSA.23.1" }
            ]
            """);

        using var db = TestDb.Create();
        (await CreateHandler(db).ExecuteAsync(null, default)).Should().Be(0);
        (await CreateHandler(db).ExecuteAsync(null, default)).Should().Be(0);

        (await db.VersesOfDay.CountAsync()).Should().Be(3);
    }

    [Fact]
    public async Task Reseeding_updates_changed_text_in_place()
    {
        await WriteVersesFile("""
            [ { "dayOfYear": 1, "reference": "Genesis 1:1", "text": "old text", "youVersionUrl": "https://www.bible.com/bible/111/GEN.1.1" } ]
            """);

        using var db = TestDb.Create();
        (await CreateHandler(db).ExecuteAsync(null, default)).Should().Be(0);

        await WriteVersesFile("""
            [ { "dayOfYear": 1, "reference": "Genesis 1:1", "text": "corrected text", "youVersionUrl": "https://www.bible.com/bible/111/GEN.1.1" } ]
            """);
        (await CreateHandler(db).ExecuteAsync(null, default)).Should().Be(0);

        (await db.VersesOfDay.CountAsync()).Should().Be(1);
        (await db.VersesOfDay.SingleAsync()).Text.Should().Be("corrected text");
    }

    [Fact]
    public async Task Invalid_rows_are_skipped()
    {
        await WriteVersesFile("""
            [
              { "dayOfYear": 0, "reference": "Bad", "text": "out of range", "youVersionUrl": "https://x" },
              { "dayOfYear": 400, "reference": "Bad", "text": "out of range", "youVersionUrl": "https://x" },
              { "dayOfYear": 5, "reference": "", "text": "missing reference", "youVersionUrl": "https://x" },
              { "dayOfYear": 6, "reference": "Good 1:1", "text": "kept", "youVersionUrl": "https://x" }
            ]
            """);

        using var db = TestDb.Create();
        (await CreateHandler(db).ExecuteAsync(null, default)).Should().Be(0);

        (await db.VersesOfDay.CountAsync()).Should().Be(1);
        (await db.VersesOfDay.SingleAsync()).DayOfYear.Should().Be(6);
    }

    private sealed class StubPathResolver : ISeedPathResolver
    {
        private readonly string _path;
        public StubPathResolver(string path) => _path = path;
        public string Resolve(string? overridePath) => overridePath ?? _path;
        public string BundleDirectory => Path.Combine(_path, ".__no_bundle__");
    }
}
