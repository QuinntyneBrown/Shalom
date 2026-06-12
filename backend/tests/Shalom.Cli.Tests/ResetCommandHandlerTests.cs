using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Shalom.Application.Common;
using Shalom.Cli.Database;
using Shalom.Cli.Reset;
using Shalom.Cli.Seed;
using Shalom.Infrastructure.Authentication;
using Xunit;

namespace Shalom.Cli.Tests;

public class ResetCommandHandlerTests : IDisposable
{
    private readonly string _dir;

    public ResetCommandHandlerTests()
    {
        _dir = Path.Combine(Path.GetTempPath(), "shalom-reset-tests-" + Guid.NewGuid());
        Directory.CreateDirectory(_dir);
    }

    public void Dispose()
    {
        if (Directory.Exists(_dir)) Directory.Delete(_dir, recursive: true);
    }

    [Fact]
    public async Task ExecuteAsync_deletes_existing_data_recreates_schema_and_seeds()
    {
        await File.WriteAllTextAsync(
            Path.Combine(_dir, "users.json"),
            """[ { "email": "fresh@shalom.app", "password": "password123" } ]""");

        const string dbName = "reset-test";
        using (var existing = TestDb.Create(dbName))
        {
            existing.Users.Add(new()
            {
                Email = "stale@shalom.app",
                NormalizedEmail = "stale@shalom.app"
            });
            await existing.SaveChangesAsync();
        }

        using var db = TestDb.Create(dbName);
        var handler = CreateHandler(db);

        (await handler.ExecuteAsync(_dir, default)).Should().Be(0);

        var users = await db.Users.Select(u => u.Email).ToListAsync();
        users.Should().Equal("fresh@shalom.app");
    }

    private ResetCommandHandler CreateHandler(Shalom.Infrastructure.Persistence.AppDbContext db)
    {
        var seed = new SeedCommandHandler(
            new StubPathResolver(_dir),
            new IJsonSeeder[]
            {
                new UserSeeder(new Pbkdf2PasswordHasher(), new SystemDateTimeProvider())
            },
            db,
            NullLogger<SeedCommandHandler>.Instance);

        return new ResetCommandHandler(
            db,
            new DatabaseOptions { Provider = DatabaseProvider.InMemory },
            seed,
            NullLogger<ResetCommandHandler>.Instance);
    }

    private sealed class StubPathResolver : ISeedPathResolver
    {
        private readonly string _path;
        public StubPathResolver(string path) => _path = path;
        public string Resolve(string? overridePath) => overridePath ?? _path;
        public string BundleDirectory => Path.Combine(_path, ".__no_bundle__");
    }
}
