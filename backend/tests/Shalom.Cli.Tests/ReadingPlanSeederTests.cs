using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Shalom.Cli.Seed;
using Xunit;

namespace Shalom.Cli.Tests;

public class ReadingPlanSeederTests : IDisposable
{
    private const string PlanJson = """
        [
          {
            "name": "John & His Letters",
            "startDate": "2026-06-15",
            "isActive": true,
            "days": [
              { "dayNumber": 1, "passageReference": "John 1", "youVersionUrl": "https://www.bible.com/bible/111/JHN.1" },
              { "dayNumber": 2, "passageReference": "John 2", "youVersionUrl": "https://www.bible.com/bible/111/JHN.2" }
            ]
          }
        ]
        """;

    private readonly string _dir;

    public ReadingPlanSeederTests()
    {
        _dir = Path.Combine(Path.GetTempPath(), "shalom-cli-tests-" + Guid.NewGuid());
        Directory.CreateDirectory(_dir);
    }

    public void Dispose()
    {
        if (Directory.Exists(_dir)) Directory.Delete(_dir, recursive: true);
    }

    private SeedCommandHandler CreateHandler(Shalom.Infrastructure.Persistence.AppDbContext db) =>
        new(new StubPathResolver(_dir), new IJsonSeeder[] { new ReadingPlanSeeder() }, db,
            NullLogger<SeedCommandHandler>.Instance);

    private async Task WritePlanFile(string json) =>
        await File.WriteAllTextAsync(Path.Combine(_dir, "reading-plan.json"), json);

    [Fact]
    public async Task Seeds_plan_and_days_from_file()
    {
        await WritePlanFile(PlanJson);

        using var db = TestDb.Create();
        (await CreateHandler(db).ExecuteAsync(null, default)).Should().Be(0);

        var plan = await db.ReadingPlans.SingleAsync();
        plan.Name.Should().Be("John & His Letters");
        plan.StartDate.Should().Be(new DateOnly(2026, 6, 15));
        plan.IsActive.Should().BeTrue();

        var days = await db.ReadingPlanDays.OrderBy(d => d.DayNumber).ToListAsync();
        days.Should().HaveCount(2);
        days[0].PassageReference.Should().Be("John 1");
        days[1].YouVersionUrl.Should().Be("https://www.bible.com/bible/111/JHN.2");
    }

    [Fact]
    public async Task Reseeding_is_idempotent_counts_stay_stable()
    {
        await WritePlanFile(PlanJson);

        using var db = TestDb.Create();
        (await CreateHandler(db).ExecuteAsync(null, default)).Should().Be(0);
        (await CreateHandler(db).ExecuteAsync(null, default)).Should().Be(0);

        (await db.ReadingPlans.CountAsync()).Should().Be(1);
        (await db.ReadingPlanDays.CountAsync()).Should().Be(2);
    }

    [Fact]
    public async Task Reseeding_preserves_completed_on()
    {
        await WritePlanFile(PlanJson);

        using var db = TestDb.Create();
        (await CreateHandler(db).ExecuteAsync(null, default)).Should().Be(0);

        var day = await db.ReadingPlanDays.SingleAsync(d => d.DayNumber == 1);
        day.CompletedOn = new DateOnly(2026, 6, 16);
        await db.SaveChangesAsync();

        (await CreateHandler(db).ExecuteAsync(null, default)).Should().Be(0);

        var reloaded = await db.ReadingPlanDays.SingleAsync(d => d.DayNumber == 1);
        reloaded.CompletedOn.Should().Be(new DateOnly(2026, 6, 16),
            "seeding must never clobber reading progress");
    }

    private sealed class StubPathResolver : ISeedPathResolver
    {
        private readonly string _path;
        public StubPathResolver(string path) => _path = path;
        public string Resolve(string? overridePath) => overridePath ?? _path;
        public string BundleDirectory => Path.Combine(_path, ".__no_bundle__");
    }
}
