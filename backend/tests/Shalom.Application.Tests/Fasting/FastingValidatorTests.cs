using FluentAssertions;
using Shalom.Application.Contracts;
using Shalom.Application.Fasting;
using Xunit;

namespace Shalom.Application.Tests.Fasting;

public class StartFastCommandValidatorTests
{
    private readonly StartFastCommandValidator _validator = new();

    [Theory]
    [InlineData(null)]
    [InlineData(1)]
    [InlineData(16)]
    [InlineData(48)]
    public void Accepts_absent_or_in_range_targets(int? target)
    {
        _validator.Validate(new StartFastCommand(target)).IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-3)]
    [InlineData(49)]
    public void Rejects_out_of_range_targets(int target)
    {
        _validator.Validate(new StartFastCommand(target)).IsValid.Should().BeFalse();
    }
}

public class ListFastsQueryValidatorTests
{
    private readonly ListFastsQueryValidator _validator = new();

    [Fact]
    public void Rejects_to_before_from()
    {
        var result = _validator.Validate(new ListFastsQuery(new DateOnly(2026, 6, 10), new DateOnly(2026, 6, 9)));
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Accepts_a_single_day_range()
    {
        var result = _validator.Validate(new ListFastsQuery(new DateOnly(2026, 6, 10), new DateOnly(2026, 6, 10)));
        result.IsValid.Should().BeTrue();
    }
}

public class UpdateFastingScheduleCommandValidatorTests
{
    private readonly UpdateFastingScheduleCommandValidator _validator = new();

    private static UpdateFastingScheduleCommand Valid(
        TimeOnly? start = null, TimeOnly? end = null, int target = 16,
        IReadOnlyList<FastingOverrideDto>? overrides = null) =>
        new(start ?? new TimeOnly(12, 0), end ?? new TimeOnly(20, 0), target, overrides ?? []);

    [Fact]
    public void Accepts_the_default_shape()
    {
        _validator.Validate(Valid(overrides:
            [new FastingOverrideDto(DayOfWeek.Sunday, new TimeOnly(13, 30), new TimeOnly(20, 30))]))
            .IsValid.Should().BeTrue();
    }

    [Fact]
    public void Rejects_a_window_that_ends_before_it_starts()
    {
        _validator.Validate(Valid(start: new TimeOnly(20, 0), end: new TimeOnly(12, 0)))
            .IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData(11)]
    [InlineData(24)]
    public void Rejects_targets_outside_12_to_23(int target)
    {
        _validator.Validate(Valid(target: target)).IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData(12)]
    [InlineData(23)]
    public void Accepts_targets_at_the_bounds(int target)
    {
        _validator.Validate(Valid(target: target)).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Rejects_two_overrides_for_the_same_weekday()
    {
        var result = _validator.Validate(Valid(overrides:
        [
            new FastingOverrideDto(DayOfWeek.Sunday, new TimeOnly(13, 0), new TimeOnly(20, 0)),
            new FastingOverrideDto(DayOfWeek.Sunday, new TimeOnly(14, 0), new TimeOnly(21, 0)),
        ]));
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Rejects_an_override_window_that_ends_before_it_starts()
    {
        var result = _validator.Validate(Valid(overrides:
            [new FastingOverrideDto(DayOfWeek.Sunday, new TimeOnly(20, 0), new TimeOnly(13, 0))]));
        result.IsValid.Should().BeFalse();
    }
}
