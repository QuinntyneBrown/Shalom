using System.CommandLine;
using Shalom.Cli.Hosting;
using Shalom.Cli.Migrate;
using Shalom.Cli.Reset;
using Shalom.Cli.Seed;

namespace Shalom.Cli;

public static class RootCommandFactory
{
    public static RootCommand Create(string[] args)
    {
        var root = new RootCommand("Shalom CLI — admin tools (database migrate/seed/reset).");
        root.AddGlobalOption(GlobalOptions.Provider);
        root.AddGlobalOption(GlobalOptions.Connection);
        root.AddGlobalOption(GlobalOptions.SeedDir);
        root.AddGlobalOption(GlobalOptions.Verbose);
        root.AddCommand(SeedCommand.Build(args));
        root.AddCommand(MigrateCommand.Build(args));
        root.AddCommand(ResetCommand.Build(args));
        return root;
    }
}
