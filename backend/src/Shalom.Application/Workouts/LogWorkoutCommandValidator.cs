using FluentValidation;

namespace Shalom.Application.Workouts;

public class LogWorkoutCommandValidator : AbstractValidator<LogWorkoutCommand>
{
    public LogWorkoutCommandValidator()
    {
        RuleFor(x => x.Equipment).IsInEnum();
        RuleFor(x => x.DurationMinutes).InclusiveBetween(1, 600);
        RuleFor(x => x.DistanceKm).GreaterThan(0).When(x => x.DistanceKm.HasValue);
        RuleFor(x => x.AvgHeartRateBpm).InclusiveBetween(30, 250).When(x => x.AvgHeartRateBpm.HasValue);
        RuleFor(x => x.ActiveCalories).GreaterThan(0).When(x => x.ActiveCalories.HasValue);
        RuleFor(x => x.Notes).MaximumLength(500);
    }
}
