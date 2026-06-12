using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Auth;

public record GetCurrentUserQuery() : IRequest<UserDto>;
