namespace Shalom.Application.Contracts;

public record AuthTokenDeliveryDto(
    string? Email,
    string? Token,
    DateTimeOffset? ExpiresAtUtc
);
