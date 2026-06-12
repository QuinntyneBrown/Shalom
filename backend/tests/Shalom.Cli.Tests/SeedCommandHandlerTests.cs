using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Shalom.Application.Common;
using Shalom.Cli.Seed;
using Shalom.Infrastructure.Authentication;
using Xunit;

namespace Shalom.Cli.Tests;

public class SeedCommandHandlerTests : IDisposable
{
    private readonly string _dir;

    public SeedCommandHandlerTests()
    {
        _dir = Path.Combine(Path.GetTempPath(), "shalom-cli-tests-" + Guid.NewGuid());
        Directory.CreateDirectory(_dir);
    }

    public void Dispose()
    {
        if (Directory.Exists(_dir)) Directory.Delete(_dir, recursive: true);
    }

    private SeedCommandHandler CreateHandler(Shalom.Infrastructure.Persistence.AppDbContext db)
    {
        var paths = new StubPathResolver(_dir);
        var clock = new SystemDateTimeProvider();
        var seeders = new IJsonSeeder[]
        {
            new UserSeeder(new Pbkdf2PasswordHasher(), clock)
        };
        return new SeedCommandHandler(paths, seeders, db, NullLogger<SeedCommandHandler>.Instance);
    }

    [Fact]
    public async Task Returns_2_when_seed_directory_missing()
    {
        using var db = TestDb.Create();
        var missing = Path.Combine(_dir, "nope");
        var paths = new StubPathResolver(missing);
        var handler = new SeedCommandHandler(paths, Array.Empty<IJsonSeeder>(), db, NullLogger<SeedCommandHandler>.Instance);

        (await handler.ExecuteAsync(null, default)).Should().Be(2);
    }

    [Fact]
    public async Task Returns_3_when_directory_exists_but_no_files_found()
    {
        using var db = TestDb.Create();
        var handler = CreateHandler(db);
        (await handler.ExecuteAsync(null, default)).Should().Be(3);
    }

    [Fact]
    public async Task Seeds_users_when_file_present()
    {
        await File.WriteAllTextAsync(
            Path.Combine(_dir, "users.json"),
            """[ { "email": "quinntynebrown@gmail.com", "password": "password123", "role": "Admin", "emailVerified": true } ]""");

        using var db = TestDb.Create();
        var handler = CreateHandler(db);

        (await handler.ExecuteAsync(null, default)).Should().Be(0);

        (await db.Users.CountAsync()).Should().Be(1);
        var seededUser = await db.Users.SingleAsync();
        seededUser.NormalizedEmail.Should().Be("quinntynebrown@gmail.com");
        seededUser.EmailVerifiedUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task Reseeding_existing_user_updates_instead_of_duplicating()
    {
        await File.WriteAllTextAsync(
            Path.Combine(_dir, "users.json"),
            """[ { "email": "quinntynebrown@gmail.com", "password": "password123" } ]""");

        using var db = TestDb.Create();

        (await CreateHandler(db).ExecuteAsync(null, default)).Should().Be(0);
        (await CreateHandler(db).ExecuteAsync(null, default)).Should().Be(0);

        (await db.Users.CountAsync()).Should().Be(1);
    }

    private sealed class StubPathResolver : ISeedPathResolver
    {
        private readonly string _path;
        public StubPathResolver(string path) => _path = path;
        public string Resolve(string? overridePath) => overridePath ?? _path;
        public string BundleDirectory => Path.Combine(_path, ".__no_bundle__");
    }
}
