using FluentAssertions;
using Shalom.Application.Workouts;
using Shalom.Domain.Enums;
using Xunit;

namespace Shalom.Application.Tests.Workouts;

public class LogWorkoutCommandValidatorTests
{
    private readonly LogWorkoutCommandValidator _validator = new();

    [Theory]
    [InlineData(1)]
    [InlineData(25)]
    [InlineData(600)]
    public void Accepts_durations_in_range(int minutes)
    {
        _validator.Validate(new LogWorkoutCommand(EquipmentType.Treadmill, minutes))
            .IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(601)]
    public void Rejects_durations_out_of_range(int minutes)
    {
        _validator.Validate(new LogWorkoutCommand(EquipmentType.Treadmill, minutes))
            .IsValid.Should().BeFalse();
    }

    [Fact]
    public void Rejects_an_unknown_equipment_value()
    {
        _validator.Validate(new LogWorkoutCommand((EquipmentType)99, 25))
            .IsValid.Should().BeFalse();
    }

    [Fact]
    public void Rejects_notes_over_500_characters()
    {
        _validator.Validate(new LogWorkoutCommand(EquipmentType.IndoorBike, 25, Notes: new string('x', 501)))
            .IsValid.Should().BeFalse();
    }

    [Fact]
    public void Rejects_a_non_positive_distance()
    {
        _validator.Validate(new LogWorkoutCommand(EquipmentType.IndoorBike, 25, DistanceKm: 0m))
            .IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData(29)]
    [InlineData(251)]
    public void Rejects_implausible_heart_rates(int bpm)
    {
        _validator.Validate(new LogWorkoutCommand(EquipmentType.IndoorBike, 25, AvgHeartRateBpm: bpm))
            .IsValid.Should().BeFalse();
    }
}
