using Shalom.Infrastructure.Persistence;

namespace Shalom.Cli.Seed;

public interface IJsonSeeder
{
    string FileName { get; }
    Task<int> SeedAsync(AppDbContext db, Stream json, CancellationToken ct);
}
