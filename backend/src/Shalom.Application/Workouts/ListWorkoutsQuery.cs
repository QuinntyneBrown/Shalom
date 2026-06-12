using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Workouts;

/// <summary>
/// Workouts whose start falls inside a local-date range (inclusive,
/// ADR-004 day boundaries). Newest first — the primary consumer is the
/// "recent workouts" list.
/// </summary>
public record ListWorkoutsQuery(DateOnly From, DateOnly To) : IRequest<IReadOnlyList<WorkoutDto>>;
