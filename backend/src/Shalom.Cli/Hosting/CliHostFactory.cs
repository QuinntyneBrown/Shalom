using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Shalom.Application.Authentication;
using Shalom.Application.Common;
using Shalom.Cli.Database;
using Shalom.Cli.Migrate;
using Shalom.Cli.Reset;
using Shalom.Cli.Seed;
using Shalom.Infrastructure.Authentication;
using Shalom.Infrastructure.Persistence;

namespace Shalom.Cli.Hosting;

public static class CliHostFactory
{
    public static IHostBuilder Create(DatabaseOptions database, bool verbose, string[] args)
    {
        return Host.CreateDefaultBuilder(args)
            .ConfigureAppConfiguration(cfg =>
            {
                cfg.SetBasePath(AppContext.BaseDirectory);
                cfg.AddJsonFile("appsettings.json", optional: true);
                cfg.AddEnvironmentVariables(prefix: "SHALOM_");
                cfg.AddEnvironmentVariables();
                cfg.AddCommandLine(args);
            })
            .ConfigureLogging((ctx, log) =>
            {
                log.ClearProviders();
                log.AddSimpleConsole(o =>
                {
                    o.SingleLine = true;
                    o.TimestampFormat = "HH:mm:ss ";
                });
                log.SetMinimumLevel(verbose ? LogLevel.Debug : LogLevel.Information);
            })
            .ConfigureServices((ctx, services) =>
            {
                ResolveConnection(database, ctx.Configuration);
                services.AddSingleton(database);
                services.AddSingleton<IDbContextRegistrar, DbContextRegistrar>();
                services.AddDbContext<AppDbContext>((sp, opt) =>
                {
                    var registrar = sp.GetRequiredService<IDbContextRegistrar>();
                    var opts = sp.GetRequiredService<DatabaseOptions>();
                    registrar.Configure(opt, opts);
                });

                services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
                services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
                services.AddSingleton<ISeedPathResolver, SeedPathResolver>();
                services.AddSingleton<IJsonSeeder, UserSeeder>();
                services.AddSingleton<IJsonSeeder, VerseSeeder>();
                services.AddSingleton<IJsonSeeder, ReadingPlanSeeder>();
                services.AddScoped<SeedCommandHandler>();
                services.AddScoped<MigrateCommandHandler>();
                services.AddScoped<ResetCommandHandler>();
            });
    }

    internal static void ResolveConnection(DatabaseOptions database, IConfiguration configuration)
    {
        if (!string.IsNullOrWhiteSpace(database.ConnectionString))
            return;

        var fromConfig = configuration.GetConnectionString("Shalom")
            ?? configuration["Shalom:ConnectionString"]
            ?? Environment.GetEnvironmentVariable("SHALOM_CONNECTION");

        if (!string.IsNullOrWhiteSpace(fromConfig))
        {
            database.ConnectionString = fromConfig;
            return;
        }

        if (database.Provider == DatabaseProvider.Sqlite)
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            if (string.IsNullOrWhiteSpace(appData))
                appData = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                    ".config");

            var dir = Path.Combine(appData, SeedPathResolver.FolderName);
            Directory.CreateDirectory(dir);
            database.ConnectionString = $"Data Source={Path.Combine(dir, "shalom.db")}";
        }
    }
}
