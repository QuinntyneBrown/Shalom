namespace Shalom.Application.Contracts;

/// <summary>Health pillar of the Today aggregate: today's workouts plus the most recent meal.</summary>
public record TodayHealthDto(
    IReadOnlyList<WorkoutDto> TodaysWorkouts,
    MealEntryDto? LastMeal);
