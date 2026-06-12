using FluentValidation;

namespace Shalom.Application.Meals;

public class LogMealCommandValidator : AbstractValidator<LogMealCommand>
{
    public LogMealCommandValidator()
    {
        RuleFor(x => x.Text).NotEmpty().MaximumLength(300);

        RuleFor(x => x.Tags)
            .NotNull()
            .Must(tags => tags.All(MealTags.IsValid))
            .WithMessage($"Tags must come from the fixed set: {string.Join(", ", MealTags.All)}.")
            .Must(tags => tags.Distinct(StringComparer.Ordinal).Count() == tags.Count)
            .WithMessage("Tags must not repeat.");
    }
}
