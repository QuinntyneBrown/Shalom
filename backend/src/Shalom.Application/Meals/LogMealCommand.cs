using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Meals;

/// <summary>
/// Logs a meal at UtcNow — free text plus tags from the fixed vocabulary.
/// No calories, no portions, no guilt.
/// </summary>
public record LogMealCommand(string Text, IReadOnlyList<string> Tags) : IRequest<MealEntryDto>;
