using FluentValidation;

namespace Shalom.Application.People;

public class UpdatePersonCommandValidator : AbstractValidator<UpdatePersonCommand>
{
    public UpdatePersonCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Relationship).MaximumLength(50);
        RuleFor(x => x.Phone).MaximumLength(30);
        RuleFor(x => x.ContactCadenceDays)
            .InclusiveBetween(1, 365)
            .When(x => x.ContactCadenceDays.HasValue);
        RuleFor(x => x.Notes).MaximumLength(1000);
    }
}
