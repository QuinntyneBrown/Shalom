using Shalom.Application.Authentication;
using Shalom.Domain.Enums;

namespace Shalom.Application.Tests.Support;

internal sealed class StubCurrentUserAccessor : ICurrentUserAccessor
{
    public Guid? UserId { get; set; }
    public string? Email { get; set; }
    public UserRole? Role { get; set; }
    public bool IsAuthenticated => UserId.HasValue;
}
