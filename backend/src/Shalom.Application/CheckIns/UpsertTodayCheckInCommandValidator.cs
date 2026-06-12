using FluentValidation;

namespace Shalom.Application.CheckIns;

public class UpsertTodayCheckInCommandValidator : AbstractValidator<UpsertTodayCheckInCommand>
{
    public UpsertTodayCheckInCommandValidator()
    {
        RuleFor(x => x.MoodRating).InclusiveBetween(1, 5);
        // Spiritual is a 4-point Far->Near dot scale by design: no mushy middle.
        RuleFor(x => x.SpiritualRating).InclusiveBetween(1, 4);
        RuleFor(x => x.Note).MaximumLength(500);
    }
}
