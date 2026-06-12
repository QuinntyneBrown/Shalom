namespace Shalom.Application.Contracts;

public record AuthSuccessDto(AuthTokensDto Token, UserDto User);
