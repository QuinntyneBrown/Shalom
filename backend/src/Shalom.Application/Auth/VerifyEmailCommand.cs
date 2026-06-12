using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Auth;

public record VerifyEmailCommand(string Token) : IRequest<UserDto>;
