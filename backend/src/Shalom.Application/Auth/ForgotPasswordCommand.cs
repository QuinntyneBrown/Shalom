using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Auth;

public record ForgotPasswordCommand(string Email) : IRequest<AuthTokenDeliveryDto>;
