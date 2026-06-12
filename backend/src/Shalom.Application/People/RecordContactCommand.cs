using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.People;

/// <summary>
/// "Connected" — stamps LastContactedOn with the server-derived local today
/// (ADR-004: the client never sends a date) and clears any snooze.
/// </summary>
public record RecordContactCommand(Guid PersonId) : IRequest<PersonDto>;
