using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Fasting;

/// <summary>
/// Starts a fast at UtcNow. <paramref name="TargetHours"/> defaults to the
/// schedule's target (16 until configured). Conflicts when a fast is
/// already open — at most one open session (ADR-005).
/// </summary>
public record StartFastCommand(int? TargetHours = null) : IRequest<FastingSessionDto>;
