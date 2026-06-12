using FluentValidation;

namespace Shalom.Application.ImportantDates;

public class AddImportantDateCommandValidator : AbstractValidator<AddImportantDateCommand>
{
    public AddImportantDateCommandValidator()
    {
        RuleFor(x => x.PersonId).NotEmpty();
        RuleFor(x => x.Label).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Month).InclusiveBetween(1, 12);

        // Day must exist in the month; year 2000 is a leap year, so a
        // yearless Feb 29 stays valid (it celebrates on Feb 28 off-leap).
        RuleFor(x => x.Day)
            .Must((cmd, day) =>
                cmd.Month is >= 1 and <= 12 &&
                day >= 1 && day <= DateTime.DaysInMonth(cmd.Year ?? 2000, cmd.Month))
            .WithMessage("Day is not valid for that month.");

        RuleFor(x => x.Year)
            .InclusiveBetween(1900, 2100)
            .When(x => x.Year.HasValue);

        RuleFor(x => x.LeadDays).InclusiveBetween(0, 365);
    }
}
