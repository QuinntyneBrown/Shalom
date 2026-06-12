using FluentAssertions;
using Shalom.Application.People;
using Xunit;

namespace Shalom.Application.Tests.People;

public class NudgePromptsTests
{
    private static readonly DateOnly Today = new(2026, 6, 12);

    [Fact]
    public void Same_person_and_day_always_render_the_same_prompt()
    {
        var first = NudgePrompts.For("Natalie", "Wife", Today);
        var second = NudgePrompts.For("Natalie", "Wife", Today);

        second.Should().Be(first, "the rotation is deterministic per (day, name)");
    }

    [Fact]
    public void Three_consecutive_days_walk_all_three_spouse_templates()
    {
        var prompts = new[]
        {
            NudgePrompts.For("Natalie", "Wife", Today),
            NudgePrompts.For("Natalie", "Wife", Today.AddDays(1)),
            NudgePrompts.For("Natalie", "Wife", Today.AddDays(2)),
        };

        prompts.Should().OnlyHaveUniqueItems();
        prompts.Should().AllSatisfy(p => p.Should().Contain("Natalie"));
    }

    [Theory]
    [InlineData("Wife")]
    [InlineData("wife")]
    [InlineData("Spouse")]
    public void Spouse_bucket_prompts_are_the_ask_appreciate_plan_flavours(string relationship)
    {
        var prompt = NudgePrompts.For("Natalie", relationship, Today);

        prompt.Should().BeOneOf(
            "Ask Natalie about her day — and really listen.",
            "Tell Natalie one thing you appreciated about her this week.",
            "Plan something small for the weekend with Natalie.");
    }

    [Theory]
    [InlineData("Daughter")]
    [InlineData("Son")]
    public void Child_bucket_uses_the_child_templates(string relationship)
    {
        var prompt = NudgePrompts.For("Maya", relationship, Today);

        prompt.Should().BeOneOf(
            "Ask Maya what made her laugh today.",
            "Ask Maya to show you what she's been making lately.",
            "Tell Maya one thing you love about who she's becoming.");
    }

    [Theory]
    [InlineData("Friend")]
    [InlineData("Community")]
    [InlineData(null)]
    public void Everyone_else_gets_the_default_templates(string? relationship)
    {
        var prompt = NudgePrompts.For("Marcus", relationship, Today);

        prompt.Should().BeOneOf(
            "Send Marcus a quick text — no reason needed.",
            "Pray for Marcus this morning, then let them know you did.",
            "Voice-note Marcus something that reminded you of them.");
    }

    [Fact]
    public void Day_of_prompt_celebrates_the_label()
    {
        NudgePrompts.ForDayOf("Maya's birthday").Should().Be("It's Maya's birthday — make it count.");
    }
}
