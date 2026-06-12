using FluentAssertions;
using Shalom.Application.ImportantDates;
using Xunit;

namespace Shalom.Application.Tests.ImportantDates;

public class ImportantDateValidatorTests
{
    private readonly AddImportantDateCommandValidator _validator = new();

    private static AddImportantDateCommand Cmd(
        int month, int day, int? year = null, string label = "Birthday", int leadDays = 7) =>
        new(Guid.NewGuid(), label, month, day, year, leadDays);

    [Fact]
    public void A_plain_birthday_is_valid()
    {
        _validator.Validate(Cmd(2, 11)).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Label_is_required_and_capped_at_50()
    {
        _validator.Validate(Cmd(2, 11, label: "")).IsValid.Should().BeFalse();
        _validator.Validate(Cmd(2, 11, label: new string('l', 51))).IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(13)]
    public void Month_must_be_1_to_12(int month)
    {
        _validator.Validate(Cmd(month, 1)).IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData(2, 30)]   // February never has 30
    [InlineData(4, 31)]   // April has 30
    [InlineData(6, 0)]
    [InlineData(1, 32)]
    public void Day_must_exist_in_the_month(int month, int day)
    {
        _validator.Validate(Cmd(month, day)).IsValid.Should().BeFalse();
    }

    [Fact]
    public void Feb_29_is_valid_without_a_year()
    {
        _validator.Validate(Cmd(2, 29)).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Feb_29_with_a_non_leap_year_is_invalid()
    {
        _validator.Validate(Cmd(2, 29, year: 2001)).IsValid.Should().BeFalse();
        _validator.Validate(Cmd(2, 29, year: 2000)).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Person_id_is_required()
    {
        _validator.Validate(new AddImportantDateCommand(Guid.Empty, "Birthday", 2, 11))
            .IsValid.Should().BeFalse();
    }

    [Fact]
    public void Lead_days_must_be_0_to_365()
    {
        _validator.Validate(Cmd(2, 11, leadDays: -1)).IsValid.Should().BeFalse();
        _validator.Validate(Cmd(2, 11, leadDays: 0)).IsValid.Should().BeTrue();
        _validator.Validate(Cmd(2, 11, leadDays: 366)).IsValid.Should().BeFalse();
    }
}
