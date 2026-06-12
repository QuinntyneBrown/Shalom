using FluentValidation;

namespace Shalom.Application.Gratitude;

public class ListGratitudeQueryValidator : AbstractValidator<ListGratitudeQuery>
{
    public ListGratitudeQueryValidator()
    {
        RuleFor(x => x.Take).InclusiveBetween(1, 100);
    }
}
