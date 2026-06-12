using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Shalom.Infrastructure.Persistence;
using Xunit;

namespace Shalom.Api.Tests.Support;

/// <summary>
/// Boots the API in-process against a per-fixture LocalDB database.
/// Applies migrations on first construction and drops the database on disposal.
/// </summary>
public sealed class ShalomApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public string DatabaseName { get; } = $"Shalom_Api_{Guid.NewGuid():N}";
    public string ConnectionString { get; }

    public ShalomApiFactory()
    {
        ConnectionString = LocalDbConnection.For(DatabaseName);
    }

    public FakeDateTimeProvider Clock { get; } = new(new DateOnly(2026, 6, 12));

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, cfg) =>
        {
            cfg.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Shalom"] = ConnectionString,
                ["Shalom:Jwt:Issuer"] = "shalom-test",
                ["Shalom:Jwt:Audience"] = "shalom-test-clients",
                ["Shalom:Jwt:SigningKey"] = "test-only-signing-key-must-be-at-least-32-bytes-long",
                ["Shalom:Jwt:AccessTokenMinutes"] = "15",
            });
        });
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<Shalom.Application.Common.IDateTimeProvider>();
            services.AddSingleton<Shalom.Application.Common.IDateTimeProvider>(Clock);
        });
    }

    public async Task InitializeAsync()
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(ConnectionString,
                sql => sql.MigrationsAssembly(typeof(AppDbContext).Assembly.GetName().Name));
        await using var ctx = new AppDbContext(optionsBuilder.Options);
        await ctx.Database.MigrateAsync();
        // Force lazy WebApplicationFactory build so configuration is honored before tests.
        _ = Services;
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        try
        {
            await using var conn = new SqlConnection(LocalDbConnection.For("master"));
            await conn.OpenAsync();
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = $@"
                IF DB_ID('{DatabaseName}') IS NOT NULL
                BEGIN
                    ALTER DATABASE [{DatabaseName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
                    DROP DATABASE [{DatabaseName}];
                END";
            await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            // best-effort cleanup
        }
        SqlConnection.ClearAllPools();
        await base.DisposeAsync();
    }
}
