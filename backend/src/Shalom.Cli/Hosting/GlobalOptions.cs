using System.CommandLine;
using Shalom.Cli.Database;

namespace Shalom.Cli.Hosting;

public static class GlobalOptions
{
    public static readonly Option<DatabaseProvider> Provider =
        new("--provider", () => DatabaseProvider.SqlServer, "Target database provider.");

    public static readonly Option<string?> Connection =
        new("--connection", "Override connection string (otherwise read from configuration).");

    public static readonly Option<string?> SeedDir =
        new("--seed-dir", "Override user-scope directory containing seed JSON files.");

    public static readonly Option<bool> Verbose =
        new("--verbose", "Emit debug-level logging.");
}
