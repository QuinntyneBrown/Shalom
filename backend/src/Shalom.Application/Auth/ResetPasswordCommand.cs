using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Auth;

public record ResetPasswordCommand(string Token, string Password) : IRequest<AuthSuccessDto>;
