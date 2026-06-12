using Shalom.Application.Common;

namespace Shalom.Api.Tests.Support;

public sealed class FakeDateTimeProvider : IDateTimeProvider
{
    public FakeDateTimeProvider(DateOnly today) => Today = today;
    public DateOnly Today { get; set; }
    public DateTimeOffset UtcNow => Today.ToDateTime(TimeOnly.MinValue);
}
