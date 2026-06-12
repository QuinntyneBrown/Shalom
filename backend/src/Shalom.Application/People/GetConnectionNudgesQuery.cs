using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.People;

/// <summary>
/// ALL currently-due people (most overdue first, ties by name), each with
/// its rendered prompt. The Today aggregate narrows this to the single
/// daily nudge; this query is the raw derived list (ADR-004: no table).
/// </summary>
public record GetConnectionNudgesQuery : IRequest<IReadOnlyList<ConnectionNudgeDto>>;
