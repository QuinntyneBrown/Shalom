using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Auth;

public record RegisterUserCommand(
    string Email,
    string Password
) : IRequest<AuthSuccessDto>;
