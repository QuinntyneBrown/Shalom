using Shalom.Domain.Enums;

namespace Shalom.Application.Authentication;

public interface ICurrentUserAccessor
{
    Guid? UserId { get; }
    string? Email { get; }
    UserRole? Role { get; }
    bool IsAuthenticated { get; }
}
