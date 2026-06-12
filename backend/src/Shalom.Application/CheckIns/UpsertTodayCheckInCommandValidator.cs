using FluentValidation;

namespace Shalom.Application.CheckIns;

public class UpsertTodayCheckInCommandValidator : AbstractValidator<UpsertTodayCheckInCommand>
{
    public UpsertTodayCheckInCommandValidator()
    {
        RuleFor(x => x.MoodRating).InclusiveBetween(1, 5);
        RuleFor(x => x.SpiritualRating).InclusiveBetween(1, 5);
        RuleFor(x => x.Note).MaximumLength(500);
    }
}
