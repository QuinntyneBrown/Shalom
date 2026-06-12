using FluentAssertions;
using Shalom.Application.Meals;
using Xunit;

namespace Shalom.Application.Tests.Meals;

public class LogMealCommandValidatorTests
{
    private readonly LogMealCommandValidator _validator = new();

    [Fact]
    public void Accepts_text_with_tags_from_the_fixed_set()
    {
        _validator.Validate(new LogMealCommand("salmon + greens", ["home-cooked", "fish", "veggie"]))
            .IsValid.Should().BeTrue();
    }

    [Fact]
    public void Accepts_an_untagged_meal()
    {
        _validator.Validate(new LogMealCommand("toast", [])).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Rejects_empty_text()
    {
        _validator.Validate(new LogMealCommand("", [])).IsValid.Should().BeFalse();
    }

    [Fact]
    public void Rejects_text_over_300_characters()
    {
        _validator.Validate(new LogMealCommand(new string('x', 301), [])).IsValid.Should().BeFalse();
    }

    [Fact]
    public void Rejects_a_tag_outside_the_fixed_set()
    {
        _validator.Validate(new LogMealCommand("burger", ["fast-food"])).IsValid.Should().BeFalse();
    }

    [Fact]
    public void Rejects_duplicate_tags()
    {
        _validator.Validate(new LogMealCommand("fish twice", ["fish", "fish"])).IsValid.Should().BeFalse();
    }
}
