using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Meals;

/// <summary>
/// Meals that occurred inside a local-date range (inclusive, ADR-004 day
/// boundaries). Newest first — the primary consumer is the "last meal" line.
/// </summary>
public record ListMealsQuery(DateOnly From, DateOnly To) : IRequest<IReadOnlyList<MealEntryDto>>;
