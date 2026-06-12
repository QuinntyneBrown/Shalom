using FluentValidation;

namespace Shalom.Application.Fasting;

public class UpdateFastingScheduleCommandValidator : AbstractValidator<UpdateFastingScheduleCommand>
{
    public UpdateFastingScheduleCommandValidator()
    {
        // Same-day windows only (ADR-005 sidesteps midnight-crossing windows).
        RuleFor(x => x.WindowEnd)
            .GreaterThan(x => x.WindowStart)
            .WithMessage("The eating window must end after it starts.");

        RuleFor(x => x.TargetFastHours).InclusiveBetween(12, 23);

        RuleFor(x => x.Overrides)
            .NotNull()
            .Must(o => o.Select(v => v.DayOfWeek).Distinct().Count() == o.Count)
            .WithMessage("At most one override per weekday.");

        RuleForEach(x => x.Overrides).ChildRules(o =>
        {
            o.RuleFor(v => v.DayOfWeek).IsInEnum();
            o.RuleFor(v => v.EatingWindowEnd)
                .GreaterThan(v => v.EatingWindowStart)
                .WithMessage("Each override window must end after it starts.");
        });
    }
}
