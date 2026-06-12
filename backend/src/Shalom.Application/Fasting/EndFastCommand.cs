using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Fasting;

/// <summary>
/// Ends the open fast at UtcNow. The returned DTO carries the derived
/// outcome — ending early is data, not failure (ADR-005).
/// </summary>
public record EndFastCommand : IRequest<FastingSessionDto>;
