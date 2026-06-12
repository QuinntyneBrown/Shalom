using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Fasting;

/// <summary>
/// The fasting surface: the open session (if any) plus the schedule with
/// today's computed window. Creates the default schedule lazily on first
/// call (ADR-005: the 6am screen shows a sensible state with zero input).
/// </summary>
public record GetCurrentFastQuery : IRequest<CurrentFastDto>;
