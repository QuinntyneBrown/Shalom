using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Auth;

public record ResendVerificationCommand(string Email) : IRequest<AuthTokenDeliveryDto>;
