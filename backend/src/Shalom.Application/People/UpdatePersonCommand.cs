using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.People;

/// <summary>Edits a person's identity fields. Contact facts (LastContactedOn, SnoozedUntil) are owned by their own commands.</summary>
public record UpdatePersonCommand(
    Guid Id,
    string Name,
    string? Relationship = null,
    string? Phone = null,
    int? ContactCadenceDays = null,
    string? Notes = null) : IRequest<PersonDto>;
