using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Shalom.Cli.Database;
using Shalom.Cli.Hosting;
using Xunit;

namespace Shalom.Cli.Tests;

public class CliHostFactoryTests
{
    [Fact]
    public void ResolveConnection_keeps_explicit_value()
    {
        var opts = new DatabaseOptions { ConnectionString = "explicit" };
        CliHostFactory.ResolveConnection(opts, Build());
        opts.ConnectionString.Should().Be("explicit");
    }

    [Fact]
    public void ResolveConnection_reads_connection_strings_section()
    {
        var opts = new DatabaseOptions();
        var cfg = Build(("ConnectionStrings:Shalom", "from-config"));
        CliHostFactory.ResolveConnection(opts, cfg);
        opts.ConnectionString.Should().Be("from-config");
    }

    [Fact]
    public void ResolveConnection_reads_flat_setting()
    {
        var opts = new DatabaseOptions();
        var cfg = Build(("Shalom:ConnectionString", "flat"));
        CliHostFactory.ResolveConnection(opts, cfg);
        opts.ConnectionString.Should().Be("flat");
    }

    [Fact]
    public void ResolveConnection_sqlite_default_points_to_user_scope_db()
    {
        var opts = new DatabaseOptions { Provider = DatabaseProvider.Sqlite };
        CliHostFactory.ResolveConnection(opts, Build());
        opts.ConnectionString.Should().StartWith("Data Source=");
        opts.ConnectionString.Should().Contain("shalom.db");
    }

    [Fact]
    public void ResolveConnection_sqlserver_with_no_settings_leaves_blank()
    {
        var opts = new DatabaseOptions { Provider = DatabaseProvider.SqlServer };
        var prior = Environment.GetEnvironmentVariable("SHALOM_CONNECTION");
        Environment.SetEnvironmentVariable("SHALOM_CONNECTION", null);
        try
        {
            CliHostFactory.ResolveConnection(opts, Build());
            opts.ConnectionString.Should().BeNullOrEmpty();
        }
        finally
        {
            Environment.SetEnvironmentVariable("SHALOM_CONNECTION", prior);
        }
    }

    [Fact]
    public void ResolveConnection_reads_shalom_connection_env_var()
    {
        var opts = new DatabaseOptions { Provider = DatabaseProvider.SqlServer };
        var prior = Environment.GetEnvironmentVariable("SHALOM_CONNECTION");
        Environment.SetEnvironmentVariable("SHALOM_CONNECTION", "from-env");
        try
        {
            CliHostFactory.ResolveConnection(opts, Build());
            opts.ConnectionString.Should().Be("from-env");
        }
        finally
        {
            Environment.SetEnvironmentVariable("SHALOM_CONNECTION", prior);
        }
    }

    [Fact]
    public void ResolveConnection_env_var_loses_to_explicit_connection()
    {
        var opts = new DatabaseOptions { ConnectionString = "explicit", Provider = DatabaseProvider.SqlServer };
        var prior = Environment.GetEnvironmentVariable("SHALOM_CONNECTION");
        Environment.SetEnvironmentVariable("SHALOM_CONNECTION", "from-env");
        try
        {
            CliHostFactory.ResolveConnection(opts, Build());
            opts.ConnectionString.Should().Be("explicit");
        }
        finally
        {
            Environment.SetEnvironmentVariable("SHALOM_CONNECTION", prior);
        }
    }

    [Fact]
    public void ResolveConnection_env_var_loses_to_configuration()
    {
        var opts = new DatabaseOptions { Provider = DatabaseProvider.SqlServer };
        var cfg = Build(("ConnectionStrings:Shalom", "from-config"));
        var prior = Environment.GetEnvironmentVariable("SHALOM_CONNECTION");
        Environment.SetEnvironmentVariable("SHALOM_CONNECTION", "from-env");
        try
        {
            CliHostFactory.ResolveConnection(opts, cfg);
            opts.ConnectionString.Should().Be("from-config");
        }
        finally
        {
            Environment.SetEnvironmentVariable("SHALOM_CONNECTION", prior);
        }
    }

    [Fact]
    public void Create_returns_builder()
    {
        var opts = new DatabaseOptions { Provider = DatabaseProvider.InMemory };
        var builder = CliHostFactory.Create(opts, verbose: true, args: Array.Empty<string>());
        builder.Should().NotBeNull();
    }

    private static IConfiguration Build(params (string Key, string Value)[] settings) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(settings.Select(s =>
                new KeyValuePair<string, string?>(s.Key, s.Value)))
            .Build();
}
