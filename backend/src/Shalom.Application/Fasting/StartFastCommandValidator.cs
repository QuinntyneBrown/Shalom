using FluentValidation;

namespace Shalom.Application.Fasting;

public class StartFastCommandValidator : AbstractValidator<StartFastCommand>
{
    public StartFastCommandValidator()
    {
        // Wider than the schedule's 12–23 configuration range on purpose: a
        // one-off short or extended fast is data, not a schedule change.
        RuleFor(x => x.TargetHours)
            .InclusiveBetween(1, 48)
            .When(x => x.TargetHours.HasValue);
    }
}
