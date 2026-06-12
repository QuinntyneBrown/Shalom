using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.People;

/// <summary>Adds someone to the circle. Cadence is optional — a person without one is never auto-nudged.</summary>
public record CreatePersonCommand(
    string Name,
    string? Relationship = null,
    string? Phone = null,
    int? ContactCadenceDays = null,
    string? Notes = null) : IRequest<PersonDto>;
