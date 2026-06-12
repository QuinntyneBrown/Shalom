using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Auth;

public record LoginCommand(string Email, string Password) : IRequest<AuthSuccessDto>;
