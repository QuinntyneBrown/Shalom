using FluentValidation;

namespace Shalom.Application.CheckIns;

public class ListCheckInsQueryValidator : AbstractValidator<ListCheckInsQuery>
{
    public ListCheckInsQueryValidator()
    {
        RuleFor(x => x.To)
            .GreaterThanOrEqualTo(x => x.From)
            .WithMessage("'to' must be on or after 'from'.");
    }
}
