using FluentValidation;

namespace Shalom.Application.Workouts;

public class ListWorkoutsQueryValidator : AbstractValidator<ListWorkoutsQuery>
{
    public ListWorkoutsQueryValidator()
    {
        RuleFor(x => x.To)
            .GreaterThanOrEqualTo(x => x.From)
            .WithMessage("'to' must be on or after 'from'.");
    }
}
