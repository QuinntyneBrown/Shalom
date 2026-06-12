using Shalom.Domain.Enums;

namespace Shalom.Application.Contracts;

public record UserDto(
    Guid Id,
    string Email,
    UserRole Role,
    DateTimeOffset? EmailVerifiedUtc
);
