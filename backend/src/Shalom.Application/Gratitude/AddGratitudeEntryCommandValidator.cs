using FluentValidation;

namespace Shalom.Application.Gratitude;

public class AddGratitudeEntryCommandValidator : AbstractValidator<AddGratitudeEntryCommand>
{
    public AddGratitudeEntryCommandValidator()
    {
        RuleFor(x => x.Text).NotEmpty().MaximumLength(500);
    }
}
