using FluentValidation;

namespace Shalom.Application.Meals;

public class ListMealsQueryValidator : AbstractValidator<ListMealsQuery>
{
    public ListMealsQueryValidator()
    {
        RuleFor(x => x.To)
            .GreaterThanOrEqualTo(x => x.From)
            .WithMessage("'to' must be on or after 'from'.");
    }
}
