using Microsoft.EntityFrameworkCore;

namespace Shalom.Cli.Database;

public interface IDbContextRegistrar
{
    void Configure(DbContextOptionsBuilder builder, DatabaseOptions options);
}
