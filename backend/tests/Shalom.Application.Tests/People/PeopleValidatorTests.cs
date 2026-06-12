using FluentAssertions;
using Shalom.Application.People;
using Xunit;

namespace Shalom.Application.Tests.People;

public class PeopleValidatorTests
{
    private readonly CreatePersonCommandValidator _create = new();
    private readonly UpdatePersonCommandValidator _update = new();

    [Fact]
    public void A_minimal_person_is_valid()
    {
        _create.Validate(new CreatePersonCommand("Natalie")).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Name_is_required_and_capped_at_100()
    {
        _create.Validate(new CreatePersonCommand("")).IsValid.Should().BeFalse();
        _create.Validate(new CreatePersonCommand(new string('n', 101))).IsValid.Should().BeFalse();
        _create.Validate(new CreatePersonCommand(new string('n', 100))).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Relationship_is_capped_at_50()
    {
        _create.Validate(new CreatePersonCommand("N", Relationship: new string('r', 51)))
            .IsValid.Should().BeFalse();
    }

    [Fact]
    public void Phone_is_capped_at_30()
    {
        _create.Validate(new CreatePersonCommand("N", Phone: new string('1', 31)))
            .IsValid.Should().BeFalse();
        _create.Validate(new CreatePersonCommand("N", Phone: "+1 416 555 0100"))
            .IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(1, true)]
    [InlineData(365, true)]
    [InlineData(366, false)]
    public void Cadence_must_be_between_1_and_365_when_given(int cadence, bool expected)
    {
        _create.Validate(new CreatePersonCommand("N", ContactCadenceDays: cadence))
            .IsValid.Should().Be(expected);
    }

    [Fact]
    public void Notes_are_capped_at_1000()
    {
        _create.Validate(new CreatePersonCommand("N", Notes: new string('x', 1001)))
            .IsValid.Should().BeFalse();
    }

    [Fact]
    public void Update_requires_an_id_and_the_same_field_rules()
    {
        _update.Validate(new UpdatePersonCommand(Guid.Empty, "Natalie")).IsValid.Should().BeFalse();
        _update.Validate(new UpdatePersonCommand(Guid.NewGuid(), "")).IsValid.Should().BeFalse();
        _update.Validate(new UpdatePersonCommand(Guid.NewGuid(), "Natalie")).IsValid.Should().BeTrue();
    }
}
