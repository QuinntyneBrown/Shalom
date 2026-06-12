using FluentAssertions;
using Shalom.Application.CheckIns;
using Xunit;

namespace Shalom.Application.Tests.CheckIns;

public class UpsertTodayCheckInCommandValidatorTests
{
    private readonly UpsertTodayCheckInCommandValidator _validator = new();

    [Theory]
    [InlineData(1, 1)]
    [InlineData(3, 4)]
    [InlineData(5, 4)]
    public void Ratings_in_range_are_valid(int mood, int spiritual)
    {
        var result = _validator.Validate(new UpsertTodayCheckInCommand(mood, spiritual, null));
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    [InlineData(-1)]
    public void Mood_rating_outside_1_to_5_fails(int mood)
    {
        var result = _validator.Validate(new UpsertTodayCheckInCommand(mood, 3, null));
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(UpsertTodayCheckInCommand.MoodRating));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(5)]
    [InlineData(6)]
    public void Spiritual_rating_outside_1_to_4_fails(int spiritual)
    {
        var result = _validator.Validate(new UpsertTodayCheckInCommand(3, spiritual, null));
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(UpsertTodayCheckInCommand.SpiritualRating));
    }

    [Fact]
    public void Note_up_to_500_characters_is_valid()
    {
        var result = _validator.Validate(new UpsertTodayCheckInCommand(3, 3, new string('a', 500)));
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Note_over_500_characters_fails()
    {
        var result = _validator.Validate(new UpsertTodayCheckInCommand(3, 3, new string('a', 501)));
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(UpsertTodayCheckInCommand.Note));
    }

    [Fact]
    public void Null_note_is_valid()
    {
        _validator.Validate(new UpsertTodayCheckInCommand(3, 3, null)).IsValid.Should().BeTrue();
    }
}
