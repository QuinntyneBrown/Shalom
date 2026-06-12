using Microsoft.EntityFrameworkCore;

namespace Shalom.Application.Tests.Support;

/// <summary>
/// One TestApp = one isolated in-memory database. Disposable to keep tests independent.
/// </summary>
internal sealed class TestApp : IAsyncDisposable
{
    public TestAppDbContext Db { get; }

    private TestApp(TestAppDbContext db) => Db = db;

    public static TestApp Create()
    {
        var options = new DbContextOptionsBuilder<TestAppDbContext>()
            .UseInMemoryDatabase($"test-{Guid.NewGuid():N}")
            .Options;
        return new TestApp(new TestAppDbContext(options));
    }

    public async ValueTask DisposeAsync()
    {
        await Db.DisposeAsync();
    }
}
