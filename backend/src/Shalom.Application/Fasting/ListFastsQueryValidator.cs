using FluentValidation;

namespace Shalom.Application.Fasting;

public class ListFastsQueryValidator : AbstractValidator<ListFastsQuery>
{
    public ListFastsQueryValidator()
    {
        RuleFor(x => x.To)
            .GreaterThanOrEqualTo(x => x.From)
            .WithMessage("'to' must be on or after 'from'.");
    }
}
