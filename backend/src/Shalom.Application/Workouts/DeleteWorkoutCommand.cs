using MediatR;

namespace Shalom.Application.Workouts;

/// <summary>Deletes one of the current user's workouts. Not found when the id is missing or owned by someone else.</summary>
public record DeleteWorkoutCommand(Guid Id) : IRequest;
