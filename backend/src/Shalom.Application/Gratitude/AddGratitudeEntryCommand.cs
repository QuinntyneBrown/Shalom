using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Gratitude;

/// <summary>
/// Adds a private gratitude note, optionally tied to a person. OccurredOn
/// is the server-derived local today (ADR-004).
/// </summary>
public record AddGratitudeEntryCommand(string Text, Guid? PersonId = null) : IRequest<GratitudeEntryDto>;
